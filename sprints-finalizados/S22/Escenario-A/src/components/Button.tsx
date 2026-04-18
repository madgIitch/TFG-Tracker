// components/Button.tsx
import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sizeStyle = styles[`size_${size}` as const];
  const variantStyle = styles[`variant_${variant}` as const];
  const textStyle = styles[`text_${variant}` as const];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        variantStyle,
        { borderRadius: theme.borderRadius.full },
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.background : theme.colors.text}
        />
      ) : (
        <Text style={[styles.text, textStyle, isDisabled && styles.textDisabled]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  variant_primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  variant_secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  variant_tertiary: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  text_primary: {
    color: theme.colors.background,
  },
  text_secondary: {
    color: theme.colors.text,
  },
  text_tertiary: {
    color: theme.colors.text,
  },
  disabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
  },
  textDisabled: {
    color: theme.colors.textSecondary,
  },
});
