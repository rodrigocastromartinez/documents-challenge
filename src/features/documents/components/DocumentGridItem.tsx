import { StyleSheet, View } from 'react-native';

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
    <View
      style={[styles.card, { width }]}
      testID={testID}
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
  version: {
    marginTop: spacing.xs,
  },
  createdAt: {
    marginTop: spacing.xs,
  },
});
