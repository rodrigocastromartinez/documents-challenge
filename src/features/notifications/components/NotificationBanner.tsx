import { useEffect, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import type { NotificationMessage } from '@/features/notifications/types';
import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

const AUTO_DISMISS_MS = 4000;

type Props = {
  message: NotificationMessage | null;
};

export function NotificationBanner({ message }: Props) {
  const [dismissedTimestamp, setDismissedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDismissedTimestamp(message.timestamp);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || message.timestamp === dismissedTimestamp) {
    return null;
  }

  function handleDismiss() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDismissedTimestamp(message?.timestamp ?? null);
  }

  return (
    <View style={styles.container} testID="notification-banner" accessibilityRole="alert">
      <Text variant="body" color={colors.onPrimary} style={styles.message}>
        {t('notifications.created', { user: message.userName, document: message.documentTitle })}
      </Text>
      <Pressable
        onPress={handleDismiss}
        testID="notification-banner-dismiss"
        accessibilityRole="button"
        accessibilityLabel={t('notifications.dismiss')}
        hitSlop={8}
      >
        <Text style={styles.dismissIcon}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  message: {
    flex: 1,
    marginRight: spacing.md,
  },
  dismissIcon: {
    fontSize: 16,
    lineHeight: 16,
    color: colors.onPrimary,
  },
});
