import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  ESTILO_VIDA_OPTIONS,
  lifestyleLabelById,
} from '../constants/swipeFilters';
import { countActiveFilters, useSwipeFilters } from '../context/SwipeFiltersContext';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';
import { profilePhotoService } from '../services/profilePhotoService';
import { profileService } from '../services/profileService';
import { swipeRejectionService } from '../services/swipeRejectionService';
import { API_CONFIG } from '../config/api';
import type { Gender } from '../types/gender';
import type { HousingSituation, LifestyleTag, Profile } from '../types/profile';
import type { SwipeFilters } from '../types/swipeFilters';
import { colors } from '../styles/tokens';
import styles from '../styles/screens/SwipeScreen.styles';

type GlassProps = {
  style?: object;
  children: React.ReactNode;
};

type SwipeProfile = {
  id: string;
  name: string;
  age?: number;
  photoUrl: string;
  housing: 'seeking' | 'offering' | null;
  zone?: string;
  budgetMin?: number;
  budgetMax?: number;
  bio: string;
  lifestyle: string[];
  interests: string[];
  preferredZones: string[];
  gender?: Gender | null;
  compatibilityScore?: number;
  profile: Profile;
};

type RecommendationProfile = {
  profile: Profile;
  compatibility_score: number;
};

const SWIPE_LIMIT = 20;
const SWIPE_STORAGE_KEY = 'swipeDaily';
const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80';

const GlassCard: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

const GlassChip: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassChip, style]}>
    {children}
  </View>
);

const GlassButton: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassButton, style]}>
    {children}
  </View>
);

const ActionButton = memo(({
  icon,
  onPress,
  disabled,
}: {
  icon: string;
  onPress?: () => void;
  disabled?: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <GlassButton style={styles.actionButton}>
          <Ionicons name={icon} size={22} color={colors.text} />
        </GlassButton>
      </Animated.View>
    </Pressable>
  );
});

export const SwipeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { filters, resetFilters, setFilters } = useSwipeFilters();

  const [swipesUsed, setSwipesUsed] = useState(0);
  const [allProfiles, setAllProfiles] = useState<SwipeProfile[]>([]);
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [excludedProfileIds, setExcludedProfileIds] = useState<string[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileHousing, setProfileHousing] = useState<HousingSituation | null>(
    null
  );
  const [photoIndexByProfile, setPhotoIndexByProfile] = useState<
    Record<string, number>
  >({});
  const [profilePhotosById, setProfilePhotosById] = useState<
    Record<string, string[]>
  >({});
  const [profileFiltersApplied, setProfileFiltersApplied] = useState(false);
  const isSwipingRef = useRef(false);

  const position = useRef(new Animated.ValueXY()).current;
  const horizontalPadding = Math.max(12, Math.round(screenWidth * 0.05));
  const cardWidth = Math.max(260, Math.min(screenWidth - horizontalPadding * 2, 460));
  const swipeThreshold = screenWidth * 0.3;
  const actionDockBottom = insets.bottom + Math.max(12, Math.round(screenHeight * 0.018));
  const actionDockHeight = Math.max(74, Math.round(screenHeight * 0.105));
  const cardsAvailableHeight =
    screenHeight - insets.top - actionDockBottom - actionDockHeight - 108;
  const cardHeight = Math.max(390, Math.min(Math.round(cardsAvailableHeight), 620));

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-3.5deg', '0deg', '3.5deg'],
    extrapolate: 'clamp',
  });

  const currentProfile = profiles[0];
  const canSwipe = swipesUsed < SWIPE_LIMIT;
  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const isOwnerOffering = profileHousing === 'offering';
  const lifestyleIdByLabel = useMemo(
    () => new Map(ESTILO_VIDA_OPTIONS.map((option) => [option.label, option.id])),
    []
  );

  const getTodayKey = useCallback(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit_> => {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, []);

  const fetchWithAuth = useCallback(async (input: RequestInfo, init: RequestInit) => {
    let headers = await getAuthHeaders();
    const tryFetch = () => fetch(input, { ...init, headers });
    let response = await tryFetch();

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await getAuthHeaders();
        response = await tryFetch();
      }
    }

    return response;
  }, [getAuthHeaders]);

  const sendLike = useCallback(async (profileId: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_CONFIG.FUNCTIONS_URL}/matches`,
        {
          method: 'POST',
          body: JSON.stringify({ user_b_id: profileId }),
        }
      );

      if (!response.ok && response.status !== 409) {
        const error = await response.text();
        console.error('Error guardando like:', error);
      }
    } catch (error) {
      console.error('Error guardando like:', error);
    }
  }, [fetchWithAuth]);

  const sendRejection = useCallback(async (profileId: string) => {
    try {
      await swipeRejectionService.createRejection(profileId);
    } catch (error) {
      console.error('Error guardando rechazo:', error);
    }
  }, []);

  const updateSwipeCount = useCallback(async (nextCount: number) => {
    setSwipesUsed(nextCount);
    await AsyncStorage.setItem(
      SWIPE_STORAGE_KEY,
      JSON.stringify({ date: getTodayKey(), count: nextCount })
    );
  }, [getTodayKey]);

  const advanceCard = useCallback(() => {
    const nextCount = Math.min(swipesUsed + 1, SWIPE_LIMIT);
    updateSwipeCount(nextCount).catch(() => undefined);
    position.setValue({ x: 0, y: 0 });
  }, [position, swipesUsed, updateSwipeCount]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentProfile || !canSwipe || isSwipingRef.current) return;
      isSwipingRef.current = true;
      const swipedId = currentProfile.id;
      if (direction === 'right') {
        sendLike(swipedId).catch(() => undefined);
      } else {
        sendRejection(swipedId).catch(() => undefined);
      }
      Animated.timing(position, {
        toValue: {
          x:
            direction === 'right'
              ? Math.round(screenWidth * 1.15)
              : -Math.round(screenWidth * 1.15),
          y: 0,
        },
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        advanceCard();
        setExcludedProfileIds((prev) =>
          prev.includes(swipedId) ? prev : [...prev, swipedId]
        );
        isSwipingRef.current = false;
      });
    },
    [advanceCard, canSwipe, currentProfile, position, screenWidth, sendLike, sendRejection]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          canSwipe &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (isSwipingRef.current) return;
          position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          if (isSwipingRef.current) {
            return;
          }
          if (!canSwipe) {
            position.setValue({ x: 0, y: 0 });
            return;
          }
          if (gesture.dx > swipeThreshold) {
            handleSwipe('right');
            return;
          }
          if (gesture.dx < -swipeThreshold) {
            handleSwipe('left');
            return;
          }
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        },
      }),
    [canSwipe, handleSwipe, position, swipeThreshold]
  );

  const formatBudget = (profile: SwipeProfile) => {
    if (profile.budgetMin != null && profile.budgetMax != null) {
      return `${profile.budgetMin}-${profile.budgetMax} EUR`;
    }
    if (profile.budgetMin != null) return `Desde ${profile.budgetMin} EUR`;
    if (profile.budgetMax != null) return `Hasta ${profile.budgetMax} EUR`;
    return 'Presupuesto flexible';
  };

  const getBadges = (profile: SwipeProfile) => {
    const badges = [];
    if (profile.housing === 'seeking') badges.push('Busco piso');
    if (profile.housing === 'offering')
      badges.push(`Tengo piso en ${profile.zone ?? 'zona top'}`);
    badges.push(formatBudget(profile));
    if (profile.preferredZones?.[0]) badges.push(profile.preferredZones[0]);
    return badges;
  };

  const mapProfileToSwipe = (
    recommendation: RecommendationProfile
  ): SwipeProfile | null => {
    const { profile, compatibility_score } = recommendation;
    const avatar = profile.avatar_url;
    const photoUrl = avatar
      ? avatar.startsWith('http')
        ? avatar
        : `${API_CONFIG.SUPABASE_URL}/storage/v1/object/public/avatars/${avatar}`
      : FALLBACK_PHOTO;

    if (!profile.display_name) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.display_name,
      age: profile.age ?? undefined,
      photoUrl,
      housing: profile.housing_situation ?? null,
      zone: profile.preferred_zones?.[0],
      budgetMin: profile.budget_min ?? undefined,
      budgetMax: profile.budget_max ?? undefined,
      bio: profile.bio ?? 'Sin descripcion por ahora.',
      interests: profile.interests ?? [],
      preferredZones: profile.preferred_zones ?? [],
      gender: profile.gender ?? null,
      compatibilityScore: compatibility_score,
      lifestyle:
        profile.lifestyle_tags && profile.lifestyle_tags.length > 0
          ? profile.lifestyle_tags.map((tag: LifestyleTag) => lifestyleLabelById.get(tag) ?? tag)
          : profile.lifestyle_preferences
            ? Object.values(profile.lifestyle_preferences).filter(
                (item): item is string => Boolean(item)
              )
            : [],
      profile,
    };
  };

  useEffect(() => {
    const loadSwipeCount = async () => {
      const today = getTodayKey();
      const stored = await AsyncStorage.getItem(SWIPE_STORAGE_KEY);
      if (!stored) {
        await AsyncStorage.setItem(
          SWIPE_STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 })
        );
        setSwipesUsed(0);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as { date?: string; count?: number };
        if (parsed.date === today && typeof parsed.count === 'number') {
          setSwipesUsed(parsed.count);
        } else {
          await AsyncStorage.setItem(
            SWIPE_STORAGE_KEY,
            JSON.stringify({ date: today, count: 0 })
          );
          setSwipesUsed(0);
        }
      } catch {
        await AsyncStorage.setItem(
          SWIPE_STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 })
        );
        setSwipesUsed(0);
      }
    };

    loadSwipeCount().catch(() => undefined);
  }, [getTodayKey]);

  useEffect(() => {
    const applyProfileFilters = async () => {
      if (profileFiltersApplied) return;
      try {
        const profile = await profileService.getProfile();
        if (!profile) {
          setProfileFiltersApplied(true);
          return;
        }
        setProfileHousing(profile.housing_situation ?? null);
        if (profile.housing_situation === 'offering') {
          await resetFilters();
          setProfileFiltersApplied(true);
          return;
        }
        if (activeFilterCount > 0) {
          setProfileFiltersApplied(true);
          return;
        }
        const mappedLifestyle =
          profile.lifestyle_tags && profile.lifestyle_tags.length > 0
            ? profile.lifestyle_tags
            : (profile.lifestyle_preferences
                ? Object.values(profile.lifestyle_preferences)
                    .filter((item): item is string => Boolean(item))
                    .map((label) => lifestyleIdByLabel.get(label))
                    .filter((id): id is string => Boolean(id))
                : []);

        await setFilters({
          housingSituation: 'any',
          gender: 'any',
          budgetMin: profile.budget_min ?? BUDGET_MIN,
          budgetMax: profile.budget_max ?? BUDGET_MAX,
          zones: profile.preferred_zones ?? [],
          city: [],
          roomCount: [],
          userType: [],
          ageRange: [18, 60],
          lifestyle: mappedLifestyle,
          interests: profile.interests ?? [],
          rules: {},
        });
      } catch (error) {
        console.warn('[SwipeScreen] Error syncing filters with profile:', error);
      } finally {
        setProfileFiltersApplied(true);
      }
    };

    applyProfileFilters().catch(() => undefined);
  }, [
    activeFilterCount,
    lifestyleIdByLabel,
    profileFiltersApplied,
    resetFilters,
    setFilters,
  ]);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoadingProfiles(true);
      setProfileError(null);
      try {
        const [recommendations, existingMatches, rejections] = await Promise.all(
          [
            profileService.getProfileRecommendations(
              activeFilterCount > 0 ? filters : undefined
            ),
            chatService.getMatches(),
            swipeRejectionService.getRejections(),
          ]
        );
        const excluded = new Set<string>();
        existingMatches.forEach((match) => excluded.add(match.profileId));
        rejections.forEach((rejection) =>
          excluded.add(rejection.rejectedProfileId)
        );
        const mapped = recommendations
          .map((rec) => mapProfileToSwipe(rec))
          .filter((profile): profile is SwipeProfile => Boolean(profile));
        const filtered = mapped.filter((profile) => !excluded.has(profile.id));
        setAllProfiles(filtered);
        setExcludedProfileIds(Array.from(excluded));
      } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        setAllProfiles([]);
        setProfileError('No se pudieron cargar perfiles reales.');
      } finally {
        setLoadingProfiles(false);
      }
    };

    if (profileFiltersApplied) {
      loadProfiles().catch(() => undefined);
    }
  }, [activeFilterCount, filters, profileFiltersApplied]);

  useEffect(() => {
    const next = applyFilters(allProfiles, filters, excludedProfileIds);
    setProfiles(next);
    position.setValue({ x: 0, y: 0 });
  }, [allProfiles, filters, excludedProfileIds, position]);

  useEffect(() => {
    const loadPhotosForProfile = async () => {
      if (!currentProfile) return;
      const profileId = currentProfile.id;
      if (profilePhotosById[profileId]) return;

      try {
        const photos = await profilePhotoService.getPhotosForProfile(profileId);
        const urls = photos.map((photo) => photo.signedUrl).filter(Boolean);
        if (urls.length > 0) {
          setProfilePhotosById((prev) => ({
            ...prev,
            [profileId]: urls,
          }));
        } else {
          setProfilePhotosById((prev) => ({
            ...prev,
            [profileId]: [currentProfile.photoUrl],
          }));
        }
      } catch (error) {
        console.error('Error cargando fotos del perfil:', error);
        setProfilePhotosById((prev) => ({
          ...prev,
          [profileId]: [currentProfile.photoUrl],
        }));
      }
    };

    loadPhotosForProfile().catch(() => undefined);
  }, [currentProfile, profilePhotosById]);

  const getProfilePhotos = (profile: SwipeProfile) =>
    profilePhotosById[profile.id] ?? [profile.photoUrl];

  const getPhotoIndex = (profile: SwipeProfile) =>
    photoIndexByProfile[profile.id] ?? 0;

  const setPhotoIndex = (profile: SwipeProfile, nextIndex: number) => {
    setPhotoIndexByProfile((prev) => ({
      ...prev,
      [profile.id]: nextIndex,
    }));
  };

  const goToNextPhoto = (profile: SwipeProfile) => {
    const photos = getProfilePhotos(profile);
    if (photos.length <= 1) return;
    const current = getPhotoIndex(profile);
    const next = (current + 1) % photos.length;
    setPhotoIndex(profile, next);
  };

  const goToPrevPhoto = (profile: SwipeProfile) => {
    const photos = getProfilePhotos(profile);
    if (photos.length <= 1) return;
    const current = getPhotoIndex(profile);
    const next = (current - 1 + photos.length) % photos.length;
    setPhotoIndex(profile, next);
  };

  const renderCard = (profile: SwipeProfile, index: number) => {
    const isTop = index === 0;
    const isNext = index === 1;
    const stackOffset = isNext ? 10 : 0;
    const stackScale = isNext ? 0.98 : 1;
    const chips = getBadges(profile).slice(0, 3);
    const compatibilityScore = Math.max(
      0,
      Math.min(100, Math.round(profile.compatibilityScore ?? 0))
    );
    const compatibilityBadgeColor =
      compatibilityScore >= 70
        ? 'rgba(34,197,94,0.9)'
        : compatibilityScore >= 40
          ? 'rgba(234,179,8,0.9)'
          : 'rgba(239,68,68,0.9)';

    const animatedStyle = isTop
      ? {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        }
      : {
          transform: [{ translateY: stackOffset }, { scale: stackScale }],
        };

    return (
      <Animated.View
        key={profile.id}
        style={[
          styles.cardWrap,
          {
            width: cardWidth,
            height: cardHeight,
            zIndex: 2 - index,
          },
          animatedStyle,
        ]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        <GlassCard style={styles.profileCard}>
          <ImageBackground
            source={{ uri: getProfilePhotos(profile)[getPhotoIndex(profile)] }}
            style={styles.profileImage}
            imageStyle={styles.profileImageRadius}
          >
            <View
              style={[
                styles.compatibilityBadge,
                { backgroundColor: compatibilityBadgeColor },
              ]}
            >
              <Text style={styles.compatibilityBadgeText}>
                {`\u26A1 ${compatibilityScore}%`}
              </Text>
            </View>
            {getProfilePhotos(profile).length > 1 && (
              <View style={styles.photoIndicators}>
                {getProfilePhotos(profile).map((_, photoIndex) => (
                  <View
                    key={`${profile.id}-dot-${photoIndex}`}
                    style={[
                      styles.photoDot,
                      photoIndex === getPhotoIndex(profile) &&
                        styles.photoDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.photoTapOverlay}>
              <TouchableOpacity
                style={styles.photoTapZone}
                onPress={() => goToPrevPhoto(profile)}
                activeOpacity={0.9}
              />
              <TouchableOpacity
                style={styles.photoTapZone}
                onPress={() => goToNextPhoto(profile)}
                activeOpacity={0.9}
              />
            </View>
            <View style={styles.profileOverlay}>
              <View style={styles.overlayContent}>
                <Text style={styles.profileName}>
                  {profile.age ? `${profile.name}, ${profile.age}` : profile.name}
                </Text>
                <View style={styles.chipRow}>
                  {chips.map((chip) => (
                    <GlassChip key={chip} style={styles.profileChip}>
                      <Text style={styles.chipText}>{chip}</Text>
                    </GlassChip>
                  ))}
                </View>
                <Text style={styles.profileBio} numberOfLines={2}>
                  {profile.bio}
                </Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('ProfileDetail', {
                      profile: profile.profile,
                    })
                  }
                >
                  <GlassButton style={styles.profileButton}>
                    <Text style={styles.profileButtonText}>
                      Ver perfil completo
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.text}
                    />
                  </GlassButton>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Math.max(8, Math.round(screenHeight * 0.012)),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Text style={styles.title}>Explorar</Text>
          <View style={styles.topActions}>
            <GlassChip style={styles.counterChip}>
              <Ionicons name="flash" size={14} color={colors.text} />
              <Text style={styles.counterText}>
                {SWIPE_LIMIT - swipesUsed} libres
              </Text>
            </GlassChip>
            {!isOwnerOffering ? (
              <Pressable onPress={() => navigation.navigate('Filters')}>
                <View>
                  <GlassButton style={styles.filterButton}>
                    <Ionicons
                      name="options-outline"
                      size={18}
                      color={colors.text}
                    />
                  </GlassButton>
                  {activeFilterCount > 0 ? (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.cardsArea}>
          <View style={styles.stack}>
            {loadingProfiles ? (
              <View style={styles.emptyState}>
                <Ionicons name="hourglass" size={36} color="#8E8E93" />
                <Text style={styles.emptyTitle}>Cargando perfiles...</Text>
                <Text style={styles.emptySubtitle}>Buscando matches cercanos.</Text>
              </View>
            ) : currentProfile ? (
              profiles.slice(0, 2).map((profile, idx) => renderCard(profile, idx))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-dislike" size={36} color="#8E8E93" />
                <Text style={styles.emptyTitle}>
                  {hasActiveFilters
                    ? 'Sin resultados con estos filtros'
                    : 'No hay mas perfiles'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasActiveFilters
                    ? 'Ajusta los filtros para ver mas perfiles.'
                    : 'Vuelve manana para mas swipes.'}
                </Text>
                {hasActiveFilters && (
                  <Pressable onPress={() => resetFilters().catch(() => undefined)}>
                    <GlassButton style={styles.clearFiltersButton}>
                      <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                    </GlassButton>
                  </Pressable>
                )}
                {profileError && (
                  <Text style={styles.emptySubtitle}>{profileError}</Text>
                )}
              </View>
            )}
            {!canSwipe && currentProfile && (
              <View style={styles.limitOverlay}>
                <Text style={styles.limitText}>Limite diario alcanzado</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <GlassCard
        style={[
          styles.actionDock,
          {
            left: horizontalPadding,
            right: horizontalPadding,
            bottom: actionDockBottom,
            paddingVertical: Math.max(10, Math.round(screenHeight * 0.014)),
          },
        ]}
      >
        <View style={styles.actionRow}>
          <ActionButton
            icon="close"
            onPress={() => handleSwipe('left')}
            disabled={!currentProfile || !canSwipe}
          />
          <ActionButton
            icon="heart"
            onPress={() => handleSwipe('right')}
            disabled={!currentProfile || !canSwipe}
          />
        </View>
      </GlassCard>
    </View>
  );
};

const applyFilters = (
  items: SwipeProfile[],
  filters: SwipeFilters,
  excludedProfileIds: string[]
) => {
  const excluded = new Set(excludedProfileIds);
  const lifestyleLabels = filters.lifestyle
    .map((id) => lifestyleLabelById.get(id) ?? id)
    .filter(Boolean);

  const hasBudgetFilter =
    filters.budgetMin > BUDGET_MIN || filters.budgetMax < BUDGET_MAX;
  const useProfileBudgetFilter =
    hasBudgetFilter && filters.housingSituation !== 'offering';

  return items.filter((profile) => {
    if (excluded.has(profile.id)) {
      return false;
    }

    if (
      filters.housingSituation !== 'any' &&
      profile.housing !== filters.housingSituation
    ) {
      return false;
    }

    if (filters.gender !== 'any') {
      if (filters.gender === 'flinta') {
        if (!profile.gender || profile.gender === 'male') {
          return false;
        }
      } else if (profile.gender !== filters.gender) {
        return false;
      }
    }

    if (filters.zones.length > 0) {
      const matchesZone = profile.preferredZones.some((zone) =>
        filters.zones.includes(zone)
      );
      if (!matchesZone) return false;
    }

    if (filters.interests.length > 0) {
      const matchesInterest = profile.interests.some((interest) =>
        filters.interests.includes(interest)
      );
      if (!matchesInterest) return false;
    }

    if (lifestyleLabels.length > 0 && profile.housing !== 'offering') {
      if (profile.lifestyle.length > 0) {
        const matchesLifestyle = profile.lifestyle.some((chip) =>
          lifestyleLabels.includes(chip)
        );
        if (!matchesLifestyle) return false;
      }
    }

    if (useProfileBudgetFilter) {
      if (profile.budgetMin == null && profile.budgetMax == null) {
        return false;
      }
      const profileMin = profile.budgetMin ?? BUDGET_MIN;
      const profileMax = profile.budgetMax ?? BUDGET_MAX;
      if (profileMax < filters.budgetMin || profileMin > filters.budgetMax) {
        return false;
      }
    }

    return true;
  });
};
