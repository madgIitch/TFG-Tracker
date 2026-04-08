import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabase';

type PremiumContextValue = {
  isPremium: boolean;
  loading: boolean;
  refetch: () => void;
};

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const refetch = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPremiumState = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsPremium(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('is_premium')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[PremiumContext] Error loading premium status:', error);
        }

        if (isMounted) {
          setIsPremium(Boolean(data?.is_premium));
        }
      } catch (error) {
        console.warn('[PremiumContext] Error loading premium status:', error);
        if (isMounted) {
          setIsPremium(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPremiumState().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [refreshSeed, user?.id]);

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

export const usePremium = (): PremiumContextValue => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};
