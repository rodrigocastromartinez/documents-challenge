import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

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
  const [highlightOpacity] = useState(() => new Animated.Value(selected ? 1 : 0));

  useEffect(() => {
    Animated.timing(highlightOpacity, {
      toValue: selected ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [selected, highlightOpacity]);

  return (
    <Pressable
      onPress={onPress}
      testID={`view-toggle-${mode}`}
      accessibilityRole="button"
      accessibilityLabel={t(
        mode === 'list' ? 'documents.viewMode.list' : 'documents.viewMode.grid',
      )}
      accessibilityState={{ selected }}
      style={styles.button}
    >
      <Animated.View style={[styles.highlight, { opacity: highlightOpacity }]} />
      <Text style={[styles.icon, selected && styles.iconSelected]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  iconSelected: {
    color: colors.primary,
  },
});
