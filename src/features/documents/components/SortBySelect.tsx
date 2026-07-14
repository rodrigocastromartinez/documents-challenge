import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n/t';

export type SortKey = 'date' | 'title';

type Props = {
  value: SortKey;
  onChange: (key: SortKey) => void;
};

export function SortBySelect({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { width, height } = useWindowDimensions();

  function handleSelect(key: SortKey) {
    onChange(key);
    setIsOpen(false);
  }

  return (
    <View style={styles.container} testID="sort-by-select">
      <Pressable
        onPress={() => setIsOpen((open) => !open)}
        testID="sort-by-select-trigger"
        accessibilityRole="button"
        accessibilityLabel={`${t('documents.sortBy')}: ${optionLabel(value)}`}
        accessibilityState={{ expanded: isOpen }}
        style={styles.trigger}
      >
        <View style={styles.label}>
          <Text variant="body" color={colors.text} style={styles.labelText}>
            ⇅ {t('documents.sortBy')}
          </Text>
        </View>
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>⌵</Text>
        </View>
      </Pressable>

      {isOpen ? (
        <>
          {/* Oversized, arbitrarily-positioned invisible backdrop so tapping anywhere else on
              screen closes the menu — sized off the window instead of a fixed guess so it
              reliably covers the screen regardless of where this control sits. */}
          <Pressable
            testID="sort-by-select-backdrop"
            onPress={() => setIsOpen(false)}
            style={[
              styles.backdrop,
              { top: -height, left: -width, width: width * 3, height: height * 3 },
            ]}
          />
          <View style={styles.menu} testID="sort-by-select-menu">
            <MenuOption
              testID="sort-by-select-option-date"
              label={t('documents.sortBy.date')}
              selected={value === 'date'}
              onPress={() => handleSelect('date')}
            />
            <MenuOption
              testID="sort-by-select-option-title"
              label={t('documents.sortBy.title')}
              selected={value === 'title'}
              onPress={() => handleSelect('title')}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

function optionLabel(key: SortKey) {
  return key === 'date' ? t('documents.sortBy.date') : t('documents.sortBy.title');
}

type MenuOptionProps = {
  testID: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

function MenuOption({ testID, label, selected, onPress }: MenuOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      style={styles.menuOption}
    >
      <Text variant="body" color={selected ? colors.primary : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  labelText: {
    fontWeight: '600',
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  chevronText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 14,
    color: colors.textSecondary,
  },
  backdrop: {
    position: 'absolute',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    minWidth: 120,
    zIndex: 1,
    elevation: 4,
  },
  menuOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
