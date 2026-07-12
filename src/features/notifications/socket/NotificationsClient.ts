import { resolveApiBaseUrl } from '@/shared/network/resolveApiBaseUrl';

export type NotificationMessage = {
  timestamp: string;
  userId: string;
  userName: string;
  documentId: string;
  documentTitle: string;
};

export type NotificationsStatus = 'connecting' | 'open' | 'closed';

type RawNotificationMessage = {
  Timestamp: string;
  UserID: string;
  UserName: string;
  DocumentID: string;
  DocumentTitle: string;
};

function mapMessage(raw: RawNotificationMessage): NotificationMessage {
  return {
    timestamp: raw.Timestamp,
    userId: raw.UserID,
    userName: raw.UserName,
    documentId: raw.DocumentID,
    documentTitle: raw.DocumentTitle,
  };
}

function resolveWebSocketUrl(): string {
  return `${resolveApiBaseUrl().replace(/^http/, 'ws')}/notifications`;
}

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// Exported standalone so the backoff math can be unit-tested without a real/mocked WebSocket —
// jest-websocket-mock's underlying `mock-socket` relies heavily on real timers internally, so
// combining it with jest.useFakeTimers() to test exact delay values is unreliable (see its
// README's "Known issues" section).
export function computeReconnectDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

export type NotificationsClientOptions = {
  url?: string;
  onMessage?: (message: NotificationMessage) => void;
  onStatusChange?: (status: NotificationsStatus) => void;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
};

// Wraps the native WebSocket connecting to the reference server's notification feed. Reconnects
// automatically with capped exponential backoff on any close/error, since the feed is expected
// to stay open for the app's whole lifetime (see TECH-PLAN.md §3.5). Deliberately independent of
// React so it can be unit-tested (jest-websocket-mock) without rendering anything.
export class NotificationsClient {
  private readonly url: string;
  private readonly onMessage: (message: NotificationMessage) => void;
  private readonly onStatusChange: (status: NotificationsStatus) => void;
  private readonly baseReconnectDelayMs: number;
  private readonly maxReconnectDelayMs: number;

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private stopped = false;

  constructor(options: NotificationsClientOptions = {}) {
    this.url = options.url ?? resolveWebSocketUrl();
    this.onMessage = options.onMessage ?? (() => {});
    this.onStatusChange = options.onStatusChange ?? (() => {});
    this.baseReconnectDelayMs = options.baseReconnectDelayMs ?? BASE_RECONNECT_DELAY_MS;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? MAX_RECONNECT_DELAY_MS;
  }

  connect(): void {
    if (this.socket) {
      return;
    }
    this.stopped = false;
    this.open();
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private open(): void {
    this.onStatusChange('connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      // Ignore events from a socket that's no longer `this.socket` — can happen when
      // disconnect() immediately followed by connect() races with this (now-stale) socket's own
      // async event delivery (e.g. React StrictMode's mount/unmount/remount in dev).
      if (socket !== this.socket) {
        return;
      }
      this.reconnectAttempt = 0;
      this.onStatusChange('open');
    };

    socket.onmessage = (event: WebSocketMessageEvent) => {
      if (socket !== this.socket) {
        return;
      }
      try {
        const raw = JSON.parse(String(event.data)) as RawNotificationMessage;
        this.onMessage(mapMessage(raw));
      } catch {
        // Malformed message from the server — drop it rather than crash the feed.
      }
    };

    socket.onclose = () => {
      if (socket !== this.socket) {
        return;
      }
      // A deliberate disconnect() shouldn't be reported as a "closed" status — that status is
      // meant to signal an unexpected drop worth surfacing to the user (e.g. via a banner), not
      // an intentional teardown (e.g. on unmount).
      if (this.stopped) {
        return;
      }
      this.onStatusChange('closed');
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      // onclose always fires right after onerror for a failed/dropped connection, so
      // reconnection scheduling lives there exclusively to avoid double-scheduling.
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped) {
      return;
    }
    const delay = computeReconnectDelay(
      this.reconnectAttempt,
      this.baseReconnectDelayMs,
      this.maxReconnectDelayMs,
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) {
        this.open();
      }
    }, delay);
  }
}
