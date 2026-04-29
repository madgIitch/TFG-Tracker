// src/components/ChipGroup.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ChipOption {
  id: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  label?: string;
  required?: boolean;
  multiline?: boolean;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  options,
  selectedIds,
  onSelect,
  label,
  required = false,
  multiline = true,
}) => {
  const theme = useTheme();
  const isDark = theme.colors.background !== '#FFFFFF';
  const dynamicStyles = StyleSheet.create({
    label: {
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    required: {
      color: theme.colors.error,
    },
    chip: {
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    chipText: {
      color: theme.colors.text,
    },
    chipSelected: {
      backgroundColor: isDark
        ? 'rgba(124, 58, 237, 0.35)'
        : 'rgba(17, 24, 39, 0.92)',
      borderColor: isDark
        ? 'rgba(167, 139, 250, 0.9)'
        : 'rgba(17, 24, 39, 0.95)',
    },
    chipUnselected: {
      backgroundColor: isDark
        ? 'rgba(15, 23, 42, 0.82)'
        : 'rgba(255, 255, 255, 0.5)',
      borderColor: isDark
        ? 'rgba(148, 163, 184, 0.5)'
        : 'rgba(255, 255, 255, 0.7)',
    },
    chipTextSelected: {
      color: isDark ? '#F8FAFC' : '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            theme.typography.label,
            dynamicStyles.label,
          ]}
        >
          {label}
          {required && <Text style={dynamicStyles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.chipContainer, !multiline && styles.singleLine]}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                dynamicStyles.chip,
                isSelected ? dynamicStyles.chipSelected : dynamicStyles.chipUnselected,
              ]}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  theme.typography.captionMedium,
                  isSelected ? dynamicStyles.chipTextSelected : dynamicStyles.chipText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  singleLine: {
    flexWrap: 'nowrap',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
