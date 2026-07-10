import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/t';

type Props = {
  size?: 'small' | 'large';
};

export function Spinner({ size = 'large' }: Props) {
  return (
    <View style={styles.container}>
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
