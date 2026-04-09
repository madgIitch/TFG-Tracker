import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const GlassBackground: React.FC = () => {
  const theme = useTheme();

  return <View style={[styles.background, { backgroundColor: theme.colors.background }]} />;
};

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF1F6',
  },
});
