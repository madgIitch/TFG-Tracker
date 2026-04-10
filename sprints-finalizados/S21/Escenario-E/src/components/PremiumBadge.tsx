import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  size?: 'sm' | 'md';
}

export const PremiumBadge: React.FC<Props> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <View style={[styles.badge, isSm ? styles.badgeSm : styles.badgeMd]}>
      <Ionicons
        name="lock-closed"
        size={isSm ? 9 : 11}
        color="#7C3AED"
        style={styles.icon}
      />
      <Text style={[styles.text, isSm ? styles.textSm : styles.textMd]}>
        Premium
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    borderRadius: 999,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  icon: {
    marginRight: 3,
  },
  text: {
    fontWeight: '600',
    color: '#7C3AED',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
