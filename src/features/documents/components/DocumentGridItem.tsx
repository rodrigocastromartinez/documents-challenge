import { Pressable, StyleSheet, View } from 'react-native';

import { shareDocument } from '@/features/documents/shareDocument';
import { Text } from '@/shared/components';
import { cardShadow, colors, spacing } from '@/shared/theme';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

type Props = {
  document: Document;
  width: number;
};

export function DocumentGridItem({ document, width }: Props) {
  const testID = `document-grid-item-${document.id}`;
  const versionLabel = t('documents.version', { version: document.version });
  const createdAtLabel = t('documents.createdAt', {
    date: formatRelativeDate(new Date(document.createdAt)),
  });

  return (
    <View style={[styles.card, { width }]} testID={testID}>
      <View style={styles.topRow}>
        <View
          style={styles.textGroup}
          accessible
          accessibilityLabel={`${document.title}, ${versionLabel}, ${createdAtLabel}`}
        >
          <Text variant="subtitle" numberOfLines={2} testID={`${testID}-title`}>
            {document.title}
          </Text>
          <Text
            variant="caption"
            color={colors.textSecondary}
            style={styles.version}
            testID={`${testID}-version`}
          >
            {versionLabel}
          </Text>
          <Text
            variant="caption"
            color={colors.textSecondary}
            style={styles.createdAt}
            testID={`${testID}-created-at`}
          >
            {createdAtLabel}
          </Text>
        </View>
        <Pressable
          onPress={() => shareDocument(document)}
          testID={`${testID}-share`}
          accessibilityRole="button"
          accessibilityLabel={t('documents.share')}
          hitSlop={8}
        >
          <Text style={styles.shareIcon}>📤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
  },
  version: {
    marginTop: spacing.xs,
  },
  createdAt: {
    marginTop: spacing.xs,
  },
  shareIcon: {
    fontSize: 16,
    lineHeight: 16,
    marginLeft: spacing.sm,
  },
});
