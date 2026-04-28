import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

interface PremiumBadgeProps {
  label?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ label = 'Premium' }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.cardSurface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons name="lock-closed" size={12} color={theme.colors.text} />
      <Text style={[styles.text, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
