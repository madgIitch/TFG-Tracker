import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../services/authService';

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  refetch: () => void;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPremiumStatus = async () => {
    try {
      const { data: authUser } = await supabaseClient.auth.getUser();
      const userId = authUser.user?.id;
      if (!userId) {
        setIsPremium(false);
        return;
      }

      const { data } = await supabaseClient
        .from('users')
        .select('is_premium')
        .eq('id', userId)
        .single();

      setIsPremium(data?.is_premium ?? false);
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPremiumStatus();
  }, []);

  return (
    <PremiumContext.Provider
      value={{ isPremium, loading, refetch: fetchPremiumStatus }}
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
