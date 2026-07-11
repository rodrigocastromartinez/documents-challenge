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

export function DocumentGridItem({ document }: Props) {
  const testID = `document-grid-item-${document.id}`;
  const versionLabel = t('documents.version', { version: document.version });

  return (
    <View
      style={styles.card}
      testID={testID}
      accessible
      accessibilityLabel={`${document.title}, ${versionLabel}`}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  version: {
    marginTop: spacing.xs,
  },
});
