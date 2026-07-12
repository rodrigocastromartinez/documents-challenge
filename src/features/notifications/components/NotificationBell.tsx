import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

const bellIcon = require('@/features/notifications/assets/bell.webp');

type Props = {
  unreadCount: number;
  onPress: () => void;
};

export function NotificationBell({ unreadCount, onPress }: Props) {
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      testID="notification-bell"
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.bell')
      }
      hitSlop={8}
      style={styles.container}
    >
      <Image source={bellIcon} style={styles.icon} resizeMode="contain" />
      {hasUnread && (
        <View style={styles.badge} testID="notification-bell-badge">
          <Text variant="caption" color={colors.onPrimary} style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: spacing.xs / 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
