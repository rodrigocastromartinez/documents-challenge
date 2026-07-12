import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';
import { t } from '@/shared/i18n/t';

type Props = {
  cachedAt: string | null;
};

export function OfflineBanner({ cachedAt }: Props) {
  const message = `${t('documents.offline')}${cachedAt ? ' - ' + t('documents.cachedData', { date: formatRelativeDate(new Date(cachedAt)) }) : ''}`;

  return (
    <View style={styles.container} testID="offline-banner" accessibilityRole="alert">
      <Text variant="caption" color={colors.textSecondary} style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  message: {
    textAlign: 'center',
  },
});
