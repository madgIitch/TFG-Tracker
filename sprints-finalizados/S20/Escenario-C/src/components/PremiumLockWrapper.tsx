import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePremium } from '../context/PremiumContext';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../styles/screens/FiltersScreen.styles';

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.premiumLockedSection}>
      <View pointerEvents="none" style={styles.lockedContent}>
        {children}
      </View>
      <View style={styles.lockOverlay}>
        <View style={styles.upgradeBanner}>
          <Ionicons name="lock-closed" size={16} color="#111827" />
          <Text style={styles.upgradeText}>
            {featureName ? `${featureName} solo Premium` : 'Solo disponible en Premium'}
          </Text>
          <TouchableOpacity onPress={onUpgradePress} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Mejorar plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
