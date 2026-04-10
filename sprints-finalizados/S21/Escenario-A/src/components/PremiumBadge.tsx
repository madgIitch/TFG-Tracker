import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

type PremiumBadgeProps = {
  label?: string;
  compact?: boolean;
};

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  label = 'Premium',
  compact = false,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.warningLight,
          borderColor: theme.colors.warning,
          paddingVertical: compact ? 4 : 6,
          paddingHorizontal: compact ? 8 : 10,
        },
      ]}
    >
      <Ionicons name="lock-closed" size={compact ? 12 : 14} color={theme.colors.warning} />
      <Text style={[styles.label, { color: theme.colors.warning }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
