import WebSocketServer from 'jest-websocket-mock';

import {
  computeReconnectDelay,
  NotificationsClient,
} from '@/features/notifications/socket/NotificationsClient';

const URL = 'ws://localhost:1234/notifications';

const rawMessage = {
  Timestamp: '2026-07-12T10:00:00.000Z',
  UserID: 'user-1',
  UserName: 'Ada Lovelace',
  DocumentID: 'doc-1',
  DocumentTitle: 'Analytical Engine Notes',
};

describe('computeReconnectDelay', () => {
  it('doubles the delay for each successive attempt', () => {
    expect(computeReconnectDelay(0, 1000, 30000)).toBe(1000);
    expect(computeReconnectDelay(1, 1000, 30000)).toBe(2000);
    expect(computeReconnectDelay(2, 1000, 30000)).toBe(4000);
  });

  it('caps the delay at maxDelayMs', () => {
    expect(computeReconnectDelay(10, 1000, 30000)).toBe(30000);
  });
});

// Real timers throughout: mock-socket (which jest-websocket-mock wraps) relies heavily on
// setTimeout internally to simulate the connection handshake, and combining it with
// jest.useFakeTimers() leaves those internal timers stuck — see the library's README "Known
// issues" section. Exponential backoff math itself is covered above without any WebSocket
// involved; these tests only need small, real delays to stay fast.
describe('NotificationsClient', () => {
  let server: WebSocketServer;

  beforeEach(() => {
    server = new WebSocketServer(URL, { jsonProtocol: false });
  });

  afterEach(() => {
    WebSocketServer.clean();
  });

  it('reports status transitions and delivers a mapped message', async () => {
    const onStatusChange = jest.fn();
    const onMessage = jest.fn();
    const client = new NotificationsClient({ url: URL, onStatusChange, onMessage });

    client.connect();
    expect(onStatusChange).toHaveBeenCalledWith('connecting');

    await server.connected;
    expect(onStatusChange).toHaveBeenCalledWith('open');

    server.send(JSON.stringify(rawMessage));

    expect(onMessage).toHaveBeenCalledWith({
      timestamp: '2026-07-12T10:00:00.000Z',
      userId: 'user-1',
      userName: 'Ada Lovelace',
      documentId: 'doc-1',
      documentTitle: 'Analytical Engine Notes',
    });

    client.disconnect();
  });

  it('drops a malformed message instead of throwing', async () => {
    const onMessage = jest.fn();
    const client = new NotificationsClient({ url: URL, onMessage });

    client.connect();
    await server.connected;

    expect(() => server.send('not json')).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();

    client.disconnect();
  });

  it('reconnects after the connection drops, and again after a second drop', async () => {
    const onStatusChange = jest.fn();
    const client = new NotificationsClient({
      url: URL,
      onStatusChange,
      baseReconnectDelayMs: 10,
      maxReconnectDelayMs: 50,
    });

    client.connect();
    await server.connected;

    server.close();
    await server.closed;
    expect(onStatusChange).toHaveBeenCalledWith('closed');

    server = new WebSocketServer(URL, { jsonProtocol: false });
    await server.connected;
    expect(onStatusChange).toHaveBeenCalledWith('open');

    // A second drop should trigger another reconnect too, not just the first.
    onStatusChange.mockClear();
    server.close();
    await server.closed;
    server = new WebSocketServer(URL, { jsonProtocol: false });
    await server.connected;
    expect(onStatusChange).toHaveBeenCalledWith('open');

    client.disconnect();
  });

  it('does not reconnect after disconnect() has been called', async () => {
    const onStatusChange = jest.fn();
    const client = new NotificationsClient({
      url: URL,
      onStatusChange,
      baseReconnectDelayMs: 10,
    });

    client.connect();
    await server.connected;
    client.disconnect();
    onStatusChange.mockClear();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('ignores a stale socket after disconnect() is immediately followed by connect()', async () => {
    const onStatusChange = jest.fn();
    const onMessage = jest.fn();
    const client = new NotificationsClient({ url: URL, onStatusChange, onMessage });

    client.connect();
    await server.connected;
    onStatusChange.mockClear();

    // No await in between: the old socket's close handshake is still in flight when the new
    // one is opened, mirroring e.g. React StrictMode's mount/unmount/remount in dev.
    client.disconnect();
    client.connect();
    await server.connected;

    // Let the stale socket's async teardown events, if any, flush before asserting.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onStatusChange.mock.calls.map(([status]) => status)).not.toContain('closed');
    expect(onStatusChange).toHaveBeenCalledWith('open');

    // A message sent now should only be delivered once, by the current (new) socket — not
    // duplicated by a stale handler left over from the old one.
    server.send(JSON.stringify(rawMessage));
    expect(onMessage).toHaveBeenCalledTimes(1);

    client.disconnect();
  });

  it('connect() is a no-op while already connected (does not open a second socket)', async () => {
    const onStatusChange = jest.fn();
    const client = new NotificationsClient({ url: URL, onStatusChange });

    client.connect();
    await server.connected;
    onStatusChange.mockClear();

    client.connect();

    expect(onStatusChange).not.toHaveBeenCalled();

    client.disconnect();
  });
});
