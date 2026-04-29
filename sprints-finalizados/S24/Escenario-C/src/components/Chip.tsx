// src/components/Chip.tsx
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ label, selected = false }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.selectionSurface : theme.colors.surfaceLight,
          borderColor: selected ? theme.colors.selectionSurface : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? theme.colors.textOnPrimary : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
