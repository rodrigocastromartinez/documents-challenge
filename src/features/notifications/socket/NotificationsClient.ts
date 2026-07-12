import type { NotificationMessage, NotificationsStatus } from '@/features/notifications/types';
import { resolveApiBaseUrl } from '@/shared/network/resolveApiBaseUrl';

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

// Extracted so the backoff math is unit-testable without fake timers, which don't mix with
// jest-websocket-mock (see AGENTS.md).
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
      // Stale socket from a disconnect() immediately followed by connect() (e.g. StrictMode
      // remount) — its own async events can still arrive after `this.socket` has moved on.
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
      // A deliberate disconnect() isn't an unexpected drop — don't report it as "closed".
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
