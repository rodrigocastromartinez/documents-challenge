import { act, renderHook } from '@testing-library/react-native';

import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { NotificationsClient } from '@/features/notifications/socket/NotificationsClient';
import { NotificationsProvider } from '@/features/notifications/store/NotificationsProvider';
import type { NotificationMessage } from '@/features/notifications/types';

jest.mock('@/features/notifications/socket/NotificationsClient');

const MockedNotificationsClient = NotificationsClient as jest.MockedClass<
  typeof NotificationsClient
>;

const message: NotificationMessage = {
  timestamp: '2026-07-12T10:00:00.000Z',
  userId: 'user-1',
  userName: 'Ada Lovelace',
  documentId: 'doc-1',
  documentTitle: 'Analytical Engine Notes',
};

describe('useNotifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when used outside a NotificationsProvider', async () => {
    await expect(renderHook(() => useNotifications())).rejects.toThrow(
      'useNotifications must be used within a NotificationsProvider',
    );
  });

  it('connects on mount and disconnects on unmount', async () => {
    const { unmount } = await renderHook(() => useNotifications(), {
      wrapper: NotificationsProvider,
    });

    const instance = MockedNotificationsClient.mock.instances[0];
    expect(instance?.connect).toHaveBeenCalledTimes(1);
    expect(instance?.disconnect).not.toHaveBeenCalled();

    await act(async () => unmount());

    expect(instance?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('reflects status changes and incoming messages from the client', async () => {
    const { result } = await renderHook(() => useNotifications(), {
      wrapper: NotificationsProvider,
    });

    expect(result.current.status).toBe('connecting');
    expect(result.current.unreadCount).toBe(0);

    const { onStatusChange, onMessage } = MockedNotificationsClient.mock.calls[0]?.[0] ?? {};

    await act(async () => onStatusChange?.('open'));
    expect(result.current.status).toBe('open');

    await act(async () => onMessage?.(message));
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.latestMessage).toEqual(message);
  });

  it('markAllRead resets unreadCount and dismisses the banner', async () => {
    const { result } = await renderHook(() => useNotifications(), {
      wrapper: NotificationsProvider,
    });

    const { onMessage } = MockedNotificationsClient.mock.calls[0]?.[0] ?? {};
    await act(async () => onMessage?.(message));
    expect(result.current.unreadCount).toBe(1);

    await act(async () => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.latestMessage).toBeNull();
  });
});
