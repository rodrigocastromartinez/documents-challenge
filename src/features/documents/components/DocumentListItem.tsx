import { Pressable, StyleSheet, View } from 'react-native';

import { shareDocument } from '@/features/documents/shareDocument';
import { Text } from '@/shared/components';
import { cardShadow, colors, spacing } from '@/shared/theme';
import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

type Props = {
  document: Document;
};

export function DocumentListItem({ document }: Props) {
  const testID = `document-list-item-${document.id}`;
  const versionLabel = t('documents.version', { version: document.version });
  const createdAtLabel = t('documents.createdAt', {
    date: formatRelativeDate(new Date(document.createdAt)),
  });

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.topRow}>
        <View
          style={styles.header}
          accessible
          accessibilityLabel={`${document.title}, ${versionLabel}, ${createdAtLabel}`}
        >
          <Text
            variant="subtitle"
            numberOfLines={1}
            style={styles.title}
            testID={`${testID}-title`}
          >
            {document.title}
          </Text>
          <Text variant="caption" color={colors.textSecondary} testID={`${testID}-version`}>
            {versionLabel}
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

      <Text
        variant="caption"
        color={colors.textSecondary}
        style={styles.createdAt}
        testID={`${testID}-created-at`}
      >
        {createdAtLabel}
      </Text>

      <View style={styles.columns}>
        <View style={styles.column} testID={`${testID}-contributors`}>
          <Text variant="caption" color={colors.text} style={styles.columnHeader}>
            👥 {t('documents.contributors')}
          </Text>
          {document.contributors.map((contributor) => (
            <Text key={contributor.id} variant="body" color={colors.textSecondary}>
              {contributor.name}
            </Text>
          ))}
        </View>

        <View style={styles.column} testID={`${testID}-attachments`}>
          <Text variant="caption" color={colors.text} style={styles.columnHeader}>
            🔗 {t('documents.attachments')}
          </Text>
          {document.attachments.map((attachment, index) => (
            <Text key={`${attachment}-${index}`} variant="body" color={colors.textSecondary}>
              {attachment}
            </Text>
          ))}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  shareIcon: {
    fontSize: 16,
    lineHeight: 16,
    marginLeft: spacing.sm,
  },
  createdAt: {
    marginBottom: spacing.md,
  },
  columns: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
});
