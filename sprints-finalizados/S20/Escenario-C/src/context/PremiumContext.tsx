import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { profileService } from '../services/profileService';

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
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
      setIsPremium(Boolean(profile && (profile as { is_premium?: boolean }).is_premium));
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, [authContext?.isAuthenticated]);

  useEffect(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  const value = useMemo(
    () => ({
      isPremium,
      loading,
      refetch,
    }),
    [isPremium, loading, refetch]
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
