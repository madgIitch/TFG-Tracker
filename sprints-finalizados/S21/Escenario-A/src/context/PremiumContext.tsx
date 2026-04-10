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
import { canUsePremiumFeature, PremiumFeature } from '../constants/premiumFeatures';

type PremiumContextValue = {
  isPremium: boolean;
  loading: boolean;
  refetch: () => void;
  canUse: (feature: PremiumFeature) => boolean;
  requireFeature: (
    feature: PremiumFeature,
    onAllowed: () => void,
    onBlocked?: () => void
  ) => void;
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

  const canUse = useCallback(
    (feature: PremiumFeature) => canUsePremiumFeature(isPremium, feature),
    [isPremium]
  );

  const requireFeature = useCallback(
    (feature: PremiumFeature, onAllowed: () => void, onBlocked?: () => void) => {
      if (canUse(feature)) {
        onAllowed();
        return;
      }
      onBlocked?.();
    },
    [canUse]
  );

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
        if (isMounted) {
          setIsPremium(Boolean(user.is_premium));
        }
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
      canUse,
      requireFeature,
    }),
    [isPremium, loading, refetch, canUse, requireFeature]
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

export type { PremiumContextValue };
export type { PremiumFeature };
