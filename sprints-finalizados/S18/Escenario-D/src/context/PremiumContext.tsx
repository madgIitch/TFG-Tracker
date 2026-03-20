import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { profileService } from '../services/profileService';
import { AuthContext } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);

  const refreshPremiumStatus = async () => {
    if (!authContext?.isAuthenticated) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    try {
      const profile = await profileService.getProfile();
      setIsPremium(!!profile?.is_premium);
    } catch (error) {
      console.error('[PremiumContext] Error fetching profile for premium status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPremiumStatus();
  }, [authContext?.isAuthenticated]);

  return (
    <PremiumContext.Provider value={{ isPremium, loading, refreshPremiumStatus }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
