import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { AuthContext } from './AuthContext';

export type Feature = 'unlimited_swipes' | 'gender_filter' | 'age_filter';

const PREMIUM_FEATURES: Record<Feature, boolean> = {
  unlimited_swipes: true,
  gender_filter: true,
  age_filter: true,
};

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  refetch: () => void;
  canUseFeature: (feature: Feature) => boolean;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authContext = useContext(AuthContext);
  const userId = authContext?.user?.id ?? null;

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPremiumStatus = async () => {
    if (!userId) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsPremium(false);
        return;
      }

      const response = await fetch(
        `${API_CONFIG.SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=is_premium`,
        {
          headers: {
            apikey: API_CONFIG.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        setIsPremium(false);
        return;
      }

      const rows: { is_premium: boolean }[] = await response.json();
      setIsPremium(rows[0]?.is_premium ?? false);
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchPremiumStatus();
  }, [userId]);

  const canUseFeature = (feature: Feature): boolean =>
    isPremium || !PREMIUM_FEATURES[feature];

  return (
    <PremiumContext.Provider
      value={{ isPremium, loading, refetch: fetchPremiumStatus, canUseFeature }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
