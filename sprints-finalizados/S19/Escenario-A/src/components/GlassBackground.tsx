import React from 'react';
import { View, StyleSheet } from 'react-native';

export const GlassBackground: React.FC = () => (
  <View style={styles.background} />
);

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF1F6',
  },
});
