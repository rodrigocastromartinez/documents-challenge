import * as Notifications from 'expo-notifications';

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
