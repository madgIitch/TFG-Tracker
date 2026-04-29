import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { PremiumFeature, usePremium } from '../context/PremiumContext';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../styles/screens/FiltersScreen.styles';
import { PremiumBadge } from './PremiumBadge';
import { PremiumUpgradeCard } from './PremiumUpgradeCard';

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
      <Pressable
        style={styles.lockOverlay}
        onPress={onUpgradePress}
        accessibilityRole="button"
        accessibilityLabel={
          featureName ? `${featureName} requiere Premium` : 'Funcion solo disponible en Premium'
        }
        accessibilityHint="Abre las opciones para mejorar el plan"
      >
        <PremiumUpgradeCard
          title={featureName ? `${featureName} solo Premium` : 'Solo disponible en Premium'}
          description="Mejora el plan para desbloquear esta funcion."
          ctaLabel="Mejorar plan"
          onUpgradePress={onUpgradePress}
          compact
        />
      </Pressable>
    </View>
  );
};
