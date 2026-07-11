import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { cardShadow } from '@/shared/theme/shadow';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';
import type { Document } from '@/features/documents/types';

type Props = {
  document: Document;
};

export function DocumentListItem({ document }: Props) {
  const testID = `document-list-item-${document.id}`;
  const versionLabel = t('documents.version', { version: document.version });

  return (
    <View style={styles.card} testID={testID}>
      <View
        style={styles.header}
        accessible
        accessibilityLabel={`${document.title}, ${versionLabel}`}
      >
        <Text variant="subtitle" numberOfLines={1} style={styles.title} testID={`${testID}-title`}>
          {document.title}
        </Text>
        <Text variant="caption" color={colors.textSecondary} testID={`${testID}-version`}>
          {versionLabel}
        </Text>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  title: {
    flexShrink: 1,
    marginRight: spacing.sm,
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
