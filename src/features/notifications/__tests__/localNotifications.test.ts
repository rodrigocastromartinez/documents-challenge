import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  dismissLocalNotifications,
  presentLocalNotification,
  requestLocalNotificationPermissions,
} from '@/features/notifications/localNotifications';
import type { NotificationMessage } from '@/features/notifications/types';

// expo-notifications is mocked project-wide in jest.setup.js.
const mockedRequestPermissions = Notifications.requestPermissionsAsync as jest.MockedFunction<
  typeof Notifications.requestPermissionsAsync
>;
const mockedScheduleNotification = Notifications.scheduleNotificationAsync as jest.MockedFunction<
  typeof Notifications.scheduleNotificationAsync
>;
const mockedDismissAll = Notifications.dismissAllNotificationsAsync as jest.MockedFunction<
  typeof Notifications.dismissAllNotificationsAsync
>;

const message: NotificationMessage = {
  timestamp: '2026-07-12T10:00:00.000Z',
  userId: 'user-1',
  userName: 'Ada Lovelace',
  documentId: 'doc-1',
  documentTitle: 'Analytical Engine Notes',
};

describe('localNotifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requestLocalNotificationPermissions requests permissions', async () => {
    await requestLocalNotificationPermissions();

    expect(mockedRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it('does not throw when requesting permissions fails', async () => {
    mockedRequestPermissions.mockRejectedValueOnce(new Error('denied'));

    await expect(requestLocalNotificationPermissions()).resolves.toBeUndefined();
  });

  it('schedules an immediate notification under a fixed identifier so newer ones replace older ones', async () => {
    await presentLocalNotification(message);

    expect(mockedScheduleNotification).toHaveBeenCalledWith({
      identifier: 'document-created',
      content: {
        title: 'New document',
        body: 'Ada Lovelace created Analytical Engine Notes',
      },
      trigger: null,
    });
  });

  it('does not throw when scheduling fails', async () => {
    mockedScheduleNotification.mockRejectedValueOnce(new Error('boom'));

    await expect(presentLocalNotification(message)).resolves.toBeUndefined();
  });

  it('dismissLocalNotifications clears delivered notifications', async () => {
    await dismissLocalNotifications();

    expect(mockedDismissAll).toHaveBeenCalledTimes(1);
  });

  it('does not throw when dismissing fails', async () => {
    mockedDismissAll.mockRejectedValueOnce(new Error('boom'));

    await expect(dismissLocalNotifications()).resolves.toBeUndefined();
  });
});

describe('on Android inside Expo Go', () => {
  // expo-notifications' own push-token side effect throws unconditionally as soon as the real
  // module is imported in this exact combination (see the comment at the top of
  // localNotifications.ts) — this reproduces that combination via a fresh module registry and
  // asserts the module degrades to safe no-ops instead of crashing on import.
  const originalPlatformOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    jest.dontMock('expo');
    jest.resetModules();
  });

  it('loads without throwing, and every export becomes a safe no-op', async () => {
    jest.resetModules();
    jest.doMock('expo', () => ({ isRunningInExpoGo: () => true }));
    Platform.OS = 'android';

    // Needs a fresh module registry after jest.resetModules() above, which a static import can't give.
    type LocalNotificationsModule = typeof import('@/features/notifications/localNotifications');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const androidExpoGoModule: LocalNotificationsModule = require('@/features/notifications/localNotifications');

    await expect(
      androidExpoGoModule.requestLocalNotificationPermissions(),
    ).resolves.toBeUndefined();
    await expect(
      androidExpoGoModule.presentLocalNotification({
        timestamp: '2026-07-12T10:00:00.000Z',
        userId: 'user-1',
        userName: 'Ada Lovelace',
        documentId: 'doc-1',
        documentTitle: 'Analytical Engine Notes',
      }),
    ).resolves.toBeUndefined();
    await expect(androidExpoGoModule.dismissLocalNotifications()).resolves.toBeUndefined();
  });
});
