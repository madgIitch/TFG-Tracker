import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  ESTILO_VIDA_OPTIONS,
  lifestyleLabelById,
} from '../constants/swipeFilters';
import { useSwipeFilters } from '../context/SwipeFiltersContext';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';
import { profilePhotoService } from '../services/profilePhotoService';
import { profileService } from '../services/profileService';
import { swipeRejectionService } from '../services/swipeRejectionService';
import { API_CONFIG } from '../config/api';
import type { Gender } from '../types/gender';
import type { HousingSituation, Profile } from '../types/profile';
import type { SwipeFilters } from '../types/swipeFilters';

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
  profile: Profile;
};

const SWIPE_LIMIT = 20;
const SWIPE_STORAGE_KEY = 'swipeDaily';
const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80';
let isSwiping = false;

// Blur + very low white fill keeps the glass subtle and system-like.
const GlassCard: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassCard, style]}>
    <BlurView
      blurType="light"
      blurAmount={18}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.08)"
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.glassFill} />
    {children}
  </View>
);

const GlassChip: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassChip, style]}>
    <BlurView
      blurType="light"
      blurAmount={14}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.08)"
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.glassFill} />
    {children}
  </View>
);

const GlassButton: React.FC<GlassProps> = ({ style, children }) => (
  <View style={[styles.glassButton, style]}>
    <BlurView
      blurType="light"
      blurAmount={16}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.08)"
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.glassFill} />
    {children}
  </View>
);

const ActionButton = ({
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
          <Ionicons name={icon} size={22} color="#1C1C1E" />
        </GlassButton>
      </Animated.View>
    </Pressable>
  );
};

export const SwipeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { filters, resetFilters, setFilters } = useSwipeFilters();

  const [currentIndex, setCurrentIndex] = useState(0);
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

  const position = useRef(new Animated.ValueXY()).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cardWidth = screenWidth - 40;
  const swipeThreshold = screenWidth * 0.3;
  const cardHeight = Math.min(520, Math.round(screenHeight * 0.68));

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-3.5deg', '0deg', '3.5deg'],
    extrapolate: 'clamp',
  });

  const currentProfile = profiles[currentIndex];
  const canSwipe = swipesUsed < SWIPE_LIMIT;
  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const isOwnerOffering = profileHousing === 'offering';
  const lifestyleIdByLabel = useMemo(
    () => new Map(ESTILO_VIDA_OPTIONS.map((option) => [option.label, option.id])),
    []
  );

  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  const getAuthHeaders = async (): Promise<HeadersInit_> => {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchWithAuth = async (input: RequestInfo, init: RequestInit) => {
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
  };

  const sendLike = async (profileId: string) => {
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
  };

  const sendRejection = async (profileId: string) => {
    try {
      await swipeRejectionService.createRejection(profileId);
    } catch (error) {
      console.error('Error guardando rechazo:', error);
    }
  };

  const updateSwipeCount = async (nextCount: number) => {
    setSwipesUsed(nextCount);
    await AsyncStorage.setItem(
      SWIPE_STORAGE_KEY,
      JSON.stringify({ date: getTodayKey(), count: nextCount })
    );
  };

  const advanceCard = () => {
    setCurrentIndex((prev) => prev + 1);
    const nextCount = Math.min(swipesUsed + 1, SWIPE_LIMIT);
    updateSwipeCount(nextCount).catch(() => undefined);
    position.setValue({ x: 0, y: 0 });
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile || !canSwipe) return;
    isSwiping = true;
    const swipedId = currentProfile.id;
    if (direction === 'right') {
      sendLike(swipedId).catch(() => undefined);
    } else {
      sendRejection(swipedId).catch(() => undefined);
    }
    Animated.timing(position, {
      toValue: {
        x: direction === 'right' ? screenWidth + 100 : -screenWidth - 100,
        y: 0,
      },
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      advanceCard();
      setExcludedProfileIds((prev) =>
        prev.includes(swipedId) ? prev : [...prev, swipedId]
      );
      isSwiping = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        canSwipe && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        canSwipe && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onStartShouldSetPanResponderCapture: () => {
        console.log('[Swipe] start capture');
        return false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        console.log('[Swipe] grant');
      },
      onPanResponderMove: (_, gesture) => {
        console.log('[Swipe] move', {
          dx: Math.round(gesture.dx),
          dy: Math.round(gesture.dy),
        });
        if (isSwiping) return;
        if (gesture.dx > swipeThreshold) {
          handleSwipe('right');
          return;
        }
        if (gesture.dx < -swipeThreshold) {
          handleSwipe('left');
          return;
        }
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        console.log('[Swipe] release', {
          dx: Math.round(gesture.dx),
          dy: Math.round(gesture.dy),
          canSwipe,
        });
        if (isSwiping) {
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
    })
  ).current;

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

  const mapProfileToSwipe = (profile: Profile): SwipeProfile | null => {
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
      lifestyle: profile.lifestyle_preferences
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
  }, []);

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
        const lifestyleValues = profile.lifestyle_preferences
          ? Object.values(profile.lifestyle_preferences).filter(
              (item): item is string => Boolean(item)
            )
          : [];
        const mappedLifestyle = lifestyleValues
          .map((label) => lifestyleIdByLabel.get(label))
          .filter((id): id is string => Boolean(id));

        await setFilters({
          housingSituation: 'any',
          gender: 'any',
          budgetMin: profile.budget_min ?? BUDGET_MIN,
          budgetMax: profile.budget_max ?? BUDGET_MAX,
          zones: profile.preferred_zones ?? [],
          lifestyle: mappedLifestyle,
          interests: profile.interests ?? [],
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
          .map((rec) => mapProfileToSwipe(rec.profile))
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
    if (!isSwiping) {
      setCurrentIndex(0);
      position.setValue({ x: 0, y: 0 });
    }
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
    if (index < currentIndex) return null;
    const isTop = index === currentIndex;
    const isNext = index === currentIndex + 1;
    const stackOffset = isNext ? 10 : 0;
    const stackScale = isNext ? 0.98 : 1;
    const chips = getBadges(profile).slice(0, 3);

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
            zIndex: profiles.length - index,
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
    <BlurView
      blurType="light"
      blurAmount={12}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.04)"
      style={styles.profileOverlayBlur}
    />
              <View style={styles.profileOverlayFill} />
              <View style={styles.overlayContent}>
                <Text style={styles.profileName}>
                  {profile.age ? `${profile.name}, ${profile.age}` : profile.name}
                </Text>
                <View style={styles.chipRow}>
                  {chips.map((chip) => (
                    <GlassChip key={chip}>
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
                      color="#1C1C1E"
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
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        }}
        blurRadius={20}
        style={styles.background}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(245,245,247,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <View style={[styles.content, styles.contentSafe]}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Explorar</Text>
          <View style={styles.topActions}>
            <GlassChip style={styles.counterChip}>
              <Ionicons name="flash" size={14} color="#1C1C1E" />
              <Text style={styles.counterText}>
                {SWIPE_LIMIT - swipesUsed} libres
              </Text>
            </GlassChip>
            {!isOwnerOffering ? (
              <Pressable onPress={() => navigation.navigate('Filters')}>
                <GlassButton style={styles.filterButton}>
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color="#1C1C1E"
                  />
                </GlassButton>
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
              profiles.slice(currentIndex, currentIndex + 2).map((profile, idx) =>
                renderCard(profile, currentIndex + idx)
              )
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

      <GlassCard style={[styles.actionDock, styles.actionDockSafe]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentSafe: {
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    overflow: 'hidden',
  },
  glassButton: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  counterChip: {
    height: 32,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
  },
  cardsArea: {
    flex: 1,
    justifyContent: 'center',
  },
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    position: 'absolute',
  },
  profileCard: {
    flex: 1,
  },
  profileImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileImageRadius: {
    borderRadius: 24,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoDotActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  photoTapOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  photoTapZone: {
    flex: 1,
  },
  profileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  profileOverlayBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  profileOverlayFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  overlayContent: {
    gap: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  profileBio: {
    fontSize: 14.5,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  profileButton: {
    justifyContent: 'space-between',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  actionDock: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
  },
  actionDockSafe: {
    bottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6C6C70',
    marginTop: 6,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 12,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  limitOverlay: {
    position: 'absolute',
    bottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

const getActiveFilterCount = (filters: SwipeFilters) => {
  let count = 0;
  if (filters.housingSituation !== 'any') count += 1;
  if (filters.gender !== 'any') count += 1;
  const hasRuleFilters = Object.values(filters.rules ?? {}).some(
    (value) => value && value !== 'flexible'
  );
  if (hasRuleFilters) count += 1;
  if (filters.budgetMin > BUDGET_MIN || filters.budgetMax < BUDGET_MAX)
    count += 1;
  if (filters.zones.length > 0) count += 1;
  if (filters.lifestyle.length > 0) count += 1;
  if (filters.interests.length > 0) count += 1;
  return count;
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
