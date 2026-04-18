import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PremiumFeature } from '../constants/premiumFeatures';
import { usePremium } from '../context/PremiumContext';
import { useTheme } from '../theme/ThemeContext';
import { PremiumBadge } from './PremiumBadge';

interface PremiumLockWrapperProps {
  children: React.ReactNode;
  feature: PremiumFeature;
  featureName?: string;
  onLockedPress?: () => void;
  showBadge?: boolean;
}

export const PremiumLockWrapper: React.FC<PremiumLockWrapperProps> = ({
  children,
  feature,
  featureName,
  onLockedPress,
  showBadge = true,
}) => {
  const { canUse, requireFeature } = usePremium();
  const theme = useTheme();

  if (canUse(feature)) {
    return <>{children}</>;
  }

  const handleLockedPress = () => {
    requireFeature(
      feature,
      () => undefined,
      () => {
        onLockedPress?.();
      }
    );
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none">{children}</View>
      {showBadge ? (
        <View style={styles.badgeWrap}>
          <PremiumBadge compact label="Premium" />
        </View>
      ) : null}
      <View
        style={[
          styles.lockOverlay,
          { backgroundColor: theme.colors.darkOverlay, borderRadius: theme.borderRadius.lg },
        ]}
      >
        <View
          style={[
            styles.upgradeBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={16} color={theme.colors.text} />
          <Text style={[styles.bannerText, { color: theme.colors.text }]}>
            {featureName ? `${featureName} es Premium` : 'Solo disponible en Premium'}
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: theme.colors.text }]}
            onPress={handleLockedPress}
          >
            <Text style={styles.upgradeButtonText}>Desbloquear</Text>
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
  badgeWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 3,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
