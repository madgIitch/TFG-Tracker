import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePremium } from '../context/PremiumContext';

interface Props {
  children: React.ReactNode;
  featureName?: string;
  onUpgradePress?: () => void;
}

export const PremiumLockWrapper: React.FC<Props> = ({
  children,
  featureName,
  onUpgradePress,
}) => {
  const { isPremium } = usePremium();

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      Alert.alert(
        'Solo Premium',
        `${featureName ?? 'Esta función'} está disponible únicamente para usuarios Premium.`,
        [{ text: 'Entendido' }]
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      <View pointerEvents="none" style={styles.childrenContainer}>
        {children}
      </View>
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Ionicons name="lock-closed" size={20} color="#7C3AED" />
          <Text style={styles.lockText}>Solo disponible en Premium</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Mejorar plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  childrenContainer: {
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    gap: 8,
  },
  lockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  upgradeButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
