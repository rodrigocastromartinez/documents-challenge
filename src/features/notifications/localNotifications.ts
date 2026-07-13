import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationMessage } from '@/features/notifications/types';
import { t } from '@/shared/i18n/t';

// Fixed identifier so each new notification replaces the previous one instead of piling up in
// the notification center — the server emits a message every 0-5s, so an unbounded stream of
// system notifications would accumulate absurdly fast. Only the most recent one matters, which
// mirrors the in-app state (a single latestMessage, no feed/history — see TECH-PLAN.md §3.5).
const NOTIFICATION_IDENTIFIER = 'document-created';

const ANDROID_CHANNEL_ID = 'documents';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestLocalNotificationPermissions(): Promise<void> {
  try {
    // Android 8+ requires a channel for notifications to display at all; a no-op elsewhere.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: t('notifications.channelName'),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.requestPermissionsAsync();
  } catch {
    // A denied/failed permission prompt shouldn't block the rest of the app.
  }
}

export async function presentLocalNotification(message: NotificationMessage): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDENTIFIER,
      content: {
        title: t('notifications.localTitle'),
        body: t('notifications.created', {
          user: message.userName,
          document: message.documentTitle,
        }),
      },
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch {
    // Best-effort — a failed local notification shouldn't crash the message pipeline.
  }
}

export async function dismissLocalNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Best-effort cleanup.
  }
}
