import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { profileService } from '../services/profileService';

export type PremiumFeature = 'advanced_filters' | 'daily_swipe_limit_bypass';

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  canUseFeature: (feature: PremiumFeature) => boolean;
  requiresUpgrade: (feature: PremiumFeature) => boolean;
  refetch: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authContext = useContext(AuthContext);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!authContext?.isAuthenticated) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await profileService.getProfile();
      const profilePremium = Boolean(
        profile && (profile as { is_premium?: boolean }).is_premium
      );
      const authUserPremium = Boolean(authContext?.user?.is_premium);
      setIsPremium(profilePremium || authUserPremium);
    } catch {
      setIsPremium(Boolean(authContext?.user?.is_premium));
    } finally {
      setLoading(false);
    }
  }, [authContext?.isAuthenticated, authContext?.user?.is_premium]);

  useEffect(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  const canUseFeature = useCallback(
    (_feature: PremiumFeature) => {
      return isPremium;
    },
    [isPremium]
  );

  const requiresUpgrade = useCallback(
    (feature: PremiumFeature) => {
      return !canUseFeature(feature);
    },
    [canUseFeature]
  );

  const value = useMemo(
    () => ({
      isPremium,
      loading,
      canUseFeature,
      requiresUpgrade,
      refetch,
    }),
    [isPremium, loading, canUseFeature, requiresUpgrade, refetch]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
