import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/Text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/spacing';
import { t } from '@/shared/i18n/t';

export type ViewMode = 'list' | 'grid';

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: Props) {
  return (
    <View style={styles.container} testID="view-toggle">
      <ToggleButton
        mode="list"
        icon="☰"
        selected={value === 'list'}
        onPress={() => onChange('list')}
      />
      <ToggleButton
        mode="grid"
        icon="⊞"
        selected={value === 'grid'}
        onPress={() => onChange('grid')}
      />
    </View>
  );
}

type ToggleButtonProps = {
  mode: ViewMode;
  icon: string;
  selected: boolean;
  onPress: () => void;
};

function ToggleButton({ mode, icon, selected, onPress }: ToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={`view-toggle-${mode}`}
      accessibilityRole="button"
      accessibilityLabel={t(
        mode === 'list' ? 'documents.viewMode.list' : 'documents.viewMode.grid',
      )}
      accessibilityState={{ selected }}
      style={[styles.button, selected && styles.buttonSelected]}
    >
      <Text style={[styles.icon, selected && styles.iconSelected]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  buttonSelected: {
    backgroundColor: colors.primaryLight,
  },
  icon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  iconSelected: {
    color: colors.primary,
  },
});
