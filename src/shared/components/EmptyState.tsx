import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/Text';
import { colors, spacing } from '@/shared/theme';

type Props = {
  title: string;
  description?: string;
  testID?: string;
};

export function EmptyState({ title, description, testID }: Props) {
  const accessibilityLabel = description ? `${title}. ${description}` : title;

  return (
    <View
      style={styles.container}
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Text variant="subtitle" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color={colors.textSecondary} style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
