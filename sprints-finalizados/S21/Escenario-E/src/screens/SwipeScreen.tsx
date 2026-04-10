import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  ESTILO_VIDA_OPTIONS,
  lifestyleLabelById,
} from '../constants/swipeFilters';
import { useSwipeFilters } from '../context/SwipeFiltersContext';
import { chatService } from '../services/chatService';
import { profilePhotoService } from '../services/profilePhotoService';
import { profileService } from '../services/profileService';
import { swipeRejectionService } from '../services/swipeRejectionService';
import { API_CONFIG } from '../config/api';
import type { Gender } from '../types/gender';
import type { HousingSituation, Profile } from '../types/profile';
import { makeStyles } from './SwipeScreen.styles';
import { useTheme } from '../theme/ThemeContext';
import { useThemeScheme } from '../theme/ThemeContext';
import type { SwipeFilters } from '../types/swipeFilters';
import { UpgradeModal } from '../components/UpgradeModal';
import { usePremium } from '../context/PremiumContext';

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
  compatibilityScore?: number;
};

const SWIPE_LIMIT = 20;
const SWIPE_STORAGE_KEY = 'swipeDaily';
const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80';
let isSwiping = false;

// Blur + very low white fill keeps the glass subtle and system-like.
const GlassCard: React.FC<GlassProps> = ({ style, children }) => {
  const theme = useTheme();
  const { isDark } = useThemeScheme();
  return (
    <View style={[{ borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }, style]}>
      <BlurView
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={18}
        reducedTransparencyFallbackColor={isDark ? 'rgba(31,41,55,0.08)' : 'rgba(255,255,255,0.08)'}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
      {children}
    </View>
  );
};

const GlassChip: React.FC<GlassProps> = ({ style, children }) => {
  const theme = useTheme();
  const { isDark } = useThemeScheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 999, overflow: 'hidden' }, style]}>
      <BlurView
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={14}
        reducedTransparencyFallbackColor={isDark ? 'rgba(31,41,55,0.08)' : 'rgba(255,255,255,0.08)'}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
      {children}
    </View>
  );
};

const GlassButton: React.FC<GlassProps> = ({ style, children }) => {
  const theme = useTheme();
  const { isDark } = useThemeScheme();
  return (
    <View style={[{ height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12, overflow: 'hidden' }, style]}>
      <BlurView
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={16}
        reducedTransparencyFallbackColor={isDark ? 'rgba(31,41,55,0.08)' : 'rgba(255,255,255,0.08)'}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.glassTint }]} />
      {children}
    </View>
  );
};

const ActionButton = ({
  icon,
  onPress,
  disabled,
}: {
  icon: string;
  onPress?: () => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
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
        <GlassButton style={{ width: 54, height: 54, borderRadius: 27 }}>
          <Ionicons name={icon} size={22} color={theme.colors.text} />
        </GlassButton>
      </Animated.View>
    </Pressable>
  );
};

export const SwipeScreen: React.FC = () => {
  const theme = useTheme();
  const { isDark } = useThemeScheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const { filters, resetFilters, setFilters } = useSwipeFilters();
  const { canUseFeature } = usePremium();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipesUsed, setSwipesUsed] = useState(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardWidth = screenWidth - 40;
  const swipeThreshold = screenWidth * 0.3;
  const cardHeight = Math.min(520, Math.round(screenHeight * 0.68));

  const rotate = position.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-3.5deg', '0deg', '3.5deg'],
    extrapolate: 'clamp',
  });

  const currentProfile = profiles[currentIndex];
  const canSwipe = canUseFeature('unlimited_swipes') || swipesUsed < SWIPE_LIMIT;
  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveFilters = activeFilterCount > 0;
  const isOwnerOffering = profileHousing === 'offering';
  const lifestyleIdByLabel = useMemo(
    () => new Map(ESTILO_VIDA_OPTIONS.map((option) => [option.label, option.id])),
    []
  );

  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  const sendLike = async (profileId: string) => {
    try {
      await matchService.sendLike(profileId);
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
        canSwipe && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        canSwipe && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onStartShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gesture) => {
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

  const mapProfileToSwipe = (profile: Profile, compatibilityScore?: number): SwipeProfile | null => {
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
      compatibilityScore,
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
          .map((rec) => mapProfileToSwipe(rec.profile, rec.compatibility_score))
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

  const getCompatColor = (score: number) => {
    if (score >= 70) return 'rgba(34,197,94,0.9)';
    if (score >= 40) return 'rgba(234,179,8,0.9)';
    return 'rgba(239,68,68,0.9)';
  };

  const renderCard = (profile: SwipeProfile, index: number) => {
    if (index < currentIndex) return null;
    const isTop = index === currentIndex;
    const chips = getBadges(profile).slice(0, 3);

    const animatedStyle = isTop
      ? {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        }
      : {};

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
            {profile.compatibilityScore != null && (
              <View
                style={[
                  styles.compatBadge,
                  { backgroundColor: getCompatColor(profile.compatibilityScore) },
                ]}
              >
                <Text style={styles.compatBadgeText}>
                  {'\u26A1'} {profile.compatibilityScore}%
                </Text>
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
                      <Text style={styles.chipText} numberOfLines={1}>{chip}</Text>
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
                      color={theme.colors.text}
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
          colors={isDark ? ['rgba(15,23,42,0.7)', 'rgba(15,23,42,0.88)'] : ['rgba(255,255,255,0.6)', 'rgba(245,245,247,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Explorar</Text>
          <View style={styles.topActions}>
            {!canUseFeature('unlimited_swipes') && (
              <GlassChip style={styles.counterChip}>
                <Ionicons name="flash" size={14} color={theme.colors.text} />
                <Text style={styles.counterText}>
                  {SWIPE_LIMIT - swipesUsed} libres
                </Text>
              </GlassChip>
            )}
            {!isOwnerOffering ? (
              <Pressable onPress={() => navigation.navigate('Filters')}>
                <GlassButton style={styles.filterButton}>
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={theme.colors.text}
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
                <Ionicons name="hourglass" size={36} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>Cargando perfiles...</Text>
                <Text style={styles.emptySubtitle}>Buscando matches cercanos.</Text>
              </View>
            ) : currentProfile ? (
              profiles.slice(currentIndex, currentIndex + 2).map((profile, idx) =>
                renderCard(profile, currentIndex + idx)
              )
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-dislike" size={36} color={theme.colors.textTertiary} />
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
                <BlurView
                  blurType="light"
                  blurAmount={18}
                  reducedTransparencyFallbackColor="rgba(255,255,255,0.85)"
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.limitContent}>
                  <Ionicons name="flash-off" size={32} color="#7C3AED" />
                  <Text style={styles.limitTitle}>Límite diario alcanzado</Text>
                  <Text style={styles.limitSubtitle}>
                    {'Has usado tus ' + SWIPE_LIMIT + ' swipes de hoy.\nVuelve mañana o hazte Premium.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.limitUpgradeBtn}
                    onPress={() => setUpgradeModalVisible(true)}
                  >
                    <Text style={styles.limitUpgradeBtnText}>Obtener Premium</Text>
                  </TouchableOpacity>
                </View>
                <UpgradeModal
                  visible={upgradeModalVisible}
                  onClose={() => setUpgradeModalVisible(false)}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <GlassCard style={[styles.actionDock, { bottom: insets.bottom + 24 }]}>
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
