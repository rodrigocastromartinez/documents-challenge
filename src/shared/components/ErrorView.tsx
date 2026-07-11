import { StyleSheet, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Text } from '@/shared/components/Text';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

type Props = {
  message: string;
  onRetry?: () => void;
  testID?: string;
};

export function ErrorView({ message, onRetry, testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <Text variant="subtitle" style={styles.message} accessibilityLabel={message}>
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button
            label={t('common.retry')}
            onPress={onRetry}
            variant="secondary"
            testID={testID ? `${testID}-retry` : undefined}
          />
        </View>
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
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
