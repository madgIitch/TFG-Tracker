import React, { useMemo } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PremiumFeature, usePremium } from '../context/PremiumContext';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../styles/screens/FiltersScreen.styles';
import { PremiumBadge } from './PremiumBadge';

interface PremiumLockWrapperProps {
  children: React.ReactNode;
  featureName?: string;
  feature?: PremiumFeature;
  onUpgradePress?: () => void;
}

export const PremiumLockWrapper: React.FC<PremiumLockWrapperProps> = ({
  children,
  featureName,
  feature = 'advanced_filters',
  onUpgradePress,
}) => {
  const { canUseFeature } = usePremium();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const unlocked = canUseFeature(feature);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.premiumLockedSection}>
      <View style={styles.lockBadgeWrap}>
        <PremiumBadge label="Premium" />
      </View>
      <View pointerEvents="none" style={styles.lockedContent}>
        {children}
      </View>
      <Pressable style={styles.lockOverlay} onPress={onUpgradePress}>
        <View style={styles.upgradeBanner}>
          <Ionicons name="lock-closed" size={16} color={theme.colors.text} />
          <Text style={styles.upgradeText}>
            {featureName ? `${featureName} solo Premium` : 'Solo disponible en Premium'}
          </Text>
          <TouchableOpacity onPress={onUpgradePress} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Mejorar plan</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </View>
  );
};
