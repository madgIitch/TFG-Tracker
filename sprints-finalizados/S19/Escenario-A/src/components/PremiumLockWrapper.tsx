import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePremium } from '../context/PremiumContext';

interface PremiumLockWrapperProps {
  children: React.ReactNode;
  featureName?: string;
  onUpgradePress?: () => void;
}

export const PremiumLockWrapper: React.FC<PremiumLockWrapperProps> = ({
  children,
  featureName,
  onUpgradePress,
}) => {
  const { isPremium } = usePremium();

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
      return;
    }

    Alert.alert(
      'Premium',
      featureName
        ? `${featureName} solo esta disponible para usuarios Premium.`
        : 'Esta funcionalidad solo esta disponible para usuarios Premium.'
    );
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none">{children}</View>
      <View style={styles.lockOverlay}>
        <View style={styles.upgradeBanner}>
          <Ionicons name="lock-closed" size={16} color="#111827" />
          <Text style={styles.bannerText}>Solo disponible en Premium</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
            <Text style={styles.upgradeButtonText}>Mejorar plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  upgradeButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upgradeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
