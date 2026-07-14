import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import {
  dismissLocalNotifications,
  presentLocalNotification,
} from '@/features/notifications/localNotifications';
import { NotificationsClient } from '@/features/notifications/socket/NotificationsClient';
import { NotificationsProvider } from '@/features/notifications/store/NotificationsProvider';
import type { NotificationMessage } from '@/features/notifications/types';

jest.mock('@/features/notifications/socket/NotificationsClient');
jest.mock('@/features/notifications/localNotifications');

const MockedNotificationsClient = NotificationsClient as jest.MockedClass<
  typeof NotificationsClient
>;
const mockedPresentLocalNotification = presentLocalNotification as jest.MockedFunction<
  typeof presentLocalNotification
>;
const mockedDismissLocalNotifications = dismissLocalNotifications as jest.MockedFunction<
  typeof dismissLocalNotifications
>;

const message: NotificationMessage = {
  timestamp: '2026-07-12T10:00:00.000Z',
  userId: 'user-1',
  userName: 'Ada Lovelace',
  documentId: 'doc-1',
  documentTitle: 'Analytical Engine Notes',
};

describe('useNotifications', () => {
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    AppState.currentState = 'active';
  });

  afterEach(() => {
    jest.clearAllMocks();
    AppState.currentState = originalAppState;
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

  it('does not present a local notification while the app is in the foreground', async () => {
    AppState.currentState = 'active';
    await renderHook(() => useNotifications(), { wrapper: NotificationsProvider });

    const { onMessage } = MockedNotificationsClient.mock.calls[0]?.[0] ?? {};
    await act(async () => onMessage?.(message));

    expect(mockedPresentLocalNotification).not.toHaveBeenCalled();
  });

  it('presents a local notification when a message arrives while backgrounded', async () => {
    AppState.currentState = 'background';
    await renderHook(() => useNotifications(), { wrapper: NotificationsProvider });

    const { onMessage } = MockedNotificationsClient.mock.calls[0]?.[0] ?? {};
    await act(async () => onMessage?.(message));

    expect(mockedPresentLocalNotification).toHaveBeenCalledWith(message);
  });

  it('dismisses delivered notifications when the app returns to the foreground', async () => {
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        appStateListener = callback;
        return { remove: jest.fn() };
      });

    await renderHook(() => useNotifications(), { wrapper: NotificationsProvider });

    await act(async () => appStateListener?.('active'));

    expect(mockedDismissLocalNotifications).toHaveBeenCalledTimes(1);
    addEventListenerSpy.mockRestore();
  });

  it('does not dismiss notifications on a transition to the background', async () => {
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        appStateListener = callback;
        return { remove: jest.fn() };
      });

    await renderHook(() => useNotifications(), { wrapper: NotificationsProvider });

    await act(async () => appStateListener?.('background'));

    expect(mockedDismissLocalNotifications).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });
});
