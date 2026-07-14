import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme';
import { t } from '@/shared/i18n/t';

type Props = {
  size?: 'small' | 'large';
  testID?: string;
};

export function Spinner({ size = 'large', testID }: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator
        size={size}
        color={colors.primary}
        accessibilityLabel={t('common.loading')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
