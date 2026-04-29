import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  iconName?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  iconName,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const sizeStyle = styles[`size_${size}` as const];
  const variantPalette = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.colors.textOnPrimary,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    },
    tertiary: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.text,
    },
  }[variant];

  const disabledPalette = {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    textColor: theme.colors.textSecondary,
  };

  const activePalette = isDisabled ? disabledPalette : variantPalette;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        {
          borderRadius: theme.borderRadius.full,
          backgroundColor: activePalette.backgroundColor,
          borderColor: activePalette.borderColor,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={activePalette.textColor}
        />
      ) : (
        <>
          {iconName ? (
            <Ionicons name={iconName} size={18} color={activePalette.textColor} />
          ) : null}
          <Text style={[styles.text, { color: activePalette.textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  size_large: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
