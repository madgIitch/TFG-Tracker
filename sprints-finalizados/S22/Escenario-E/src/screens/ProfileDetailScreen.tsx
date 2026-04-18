// src/screens/ProfileDetailScreen.tsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

import { API_CONFIG } from '../config/api';
import { profileService } from '../services/profileService';
import { profilePhotoService } from '../services/profilePhotoService';
import { roomService } from '../services/roomService';
import { roomExtrasService } from '../services/roomExtrasService';
import { roomAssignmentService } from '../services/roomAssignmentService';
import { AuthContext } from '../context/AuthContext';
import { INTERESES_OPTIONS, ZONAS_OPTIONS } from '../constants/swipeFilters';
import { lifestyleTagById } from '../constants/lifestyleTags';
import type { Profile, ProfilePhoto } from '../types/profile';
import type { Flat, Room, RoomExtras } from '../types/room';
import { HERO_HEIGHT, makeStyles } from './ProfileDetailScreen.styles';
import { useTheme } from '../theme/ThemeContext';
import { useThemeScheme } from '../theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProfileDetailScreenProps {
  userId?: string;
}

const roomTypeLabel = new Map([
  ['individual', 'Individual'],
  ['doble', 'Doble'],
]);

const commonAreaLabel = new Map([
  ['salon', 'Salon'],
  ['cocina', 'Cocina'],
  ['comedor', 'Comedor'],
  ['bano_compartido', 'Bano compartido'],
  ['terraza', 'Terraza'],
  ['patio', 'Patio'],
  ['lavadero', 'Lavadero'],
  ['pasillo', 'Pasillo'],
  ['recibidor', 'Recibidor'],
  ['trastero', 'Trastero'],
  ['estudio', 'Sala de estudio'],
]);

const interestLabelById = new Map(
  INTERESES_OPTIONS.map((option) => [option.id, option.label])
);

const zoneLabelById = new Map(
  ZONAS_OPTIONS.map((option) => [option.id, option.label])
);

const SUB_RULE_TYPE_MAP = new Map<
  string,
  { ruleType: 'visitas' | 'fumar' | 'mascotas'; isNegative: boolean }
>([
  ['si, con aviso', { ruleType: 'visitas', isNegative: false }],
  ['no permitidas', { ruleType: 'visitas', isNegative: true }],
  ['si, pero sin dormir', { ruleType: 'visitas', isNegative: false }],
  ['sin problema', { ruleType: 'visitas', isNegative: false }],
  ['no fumar', { ruleType: 'fumar', isNegative: true }],
  ['solo en terraza/balcon', { ruleType: 'fumar', isNegative: false }],
  ['permitido en zonas comunes', { ruleType: 'fumar', isNegative: false }],
  ['no se permiten', { ruleType: 'mascotas', isNegative: true }],
  ['solo gatos', { ruleType: 'mascotas', isNegative: false }],
  ['solo perros', { ruleType: 'mascotas', isNegative: false }],
  ['permitidas bajo acuerdo', { ruleType: 'mascotas', isNegative: false }],
]);

const getRuleIcon = (rule: string) => {
  const normalized = rule.toLowerCase().trim();
  const subRuleMatch = SUB_RULE_TYPE_MAP.get(normalized);
  const ruleType = subRuleMatch?.ruleType ?? (() => {
    if (
      normalized.includes('ruido') ||
      normalized.includes('silencio') ||
      normalized.includes('horario flexible')
    ) {
      return 'ruido';
    }
    if (normalized.includes('visitas')) return 'visitas';
    if (normalized.includes('limpieza')) return 'limpieza';
    if (normalized.includes('fumar')) return 'fumar';
    if (normalized.includes('mascotas') || normalized.includes('mascot')) return 'mascotas';
    if (normalized.includes('cocina')) return 'cocina';
    if (normalized.includes('banos')) return 'banos';
    if (normalized.includes('basura')) return 'basura';
    if (
      normalized.includes('puerta') ||
      normalized.includes('llave') ||
      normalized.includes('seguridad')
    ) {
      return 'seguridad';
    }
    return 'otros';
  })();

  const isNegative =
    subRuleMatch?.isNegative ??
    ((ruleType === 'visitas' && normalized.includes('no permitidas')) ||
      (ruleType === 'fumar' && normalized.includes('no fumar')) ||
      (ruleType === 'mascotas' && normalized.includes('no se permiten')));

  const emojiByType: Record<string, { positive: string; negative: string }> = {
    ruido: { positive: '\u{1F4E3}', negative: '\u{1F507}' },
    visitas: {
      positive: '\u{1F465}',
      negative: '\u{1F465}\u{1F6AB}',
    },
    limpieza: {
      positive: '\u{1F9F9}',
      negative: '\u{1F6AB}\u{1F9F9}',
    },
    fumar: { positive: '\u{1F6AC}', negative: '\u{1F6AD}' },
    mascotas: {
      positive: '\u{1F43E}',
      negative: '\u{1F43E}\u{1F6AB}',
    },
    cocina: {
      positive: '\u{1F373}',
      negative: '\u{1F6AB}\u{1F373}',
    },
    banos: {
      positive: '\u{1F6BF}',
      negative: '\u{1F6AB}\u{1F6BF}',
    },
    basura: {
      positive: '\u{1F5D1}\u{FE0F}',
      negative: '\u{1F6AB}\u{1F5D1}\u{FE0F}',
    },
    seguridad: { positive: '\u{1F510}', negative: '\u{1F513}' },
    otros: { positive: '\u{2728}', negative: '\u{1F6AB}\u{2728}' },
  };

  const emoji = emojiByType[ruleType] ?? emojiByType.otros;
  return isNegative ? emoji.negative : emoji.positive;
};

const getServiceIcon = (serviceName: string) => {
  const normalized = serviceName.toLowerCase();
  if (normalized.includes('luz') || normalized.includes('electric')) {
    return '\u{26A1}';
  }
  if (normalized.includes('agua')) return '\u{1F4A7}';
  if (normalized.includes('gas')) return '\u{1F525}';
  if (normalized.includes('internet') || normalized.includes('wifi')) {
    return '\u{1F4F6}';
  }
  if (normalized.includes('limpieza')) return '\u{1F9F9}';
  if (normalized.includes('calefaccion') || normalized.includes('calefacción')) {
    return '\u{1F321}\u{FE0F}';
  }
  return '\u{1F527}';
};

export const ProfileDetailScreen: React.FC<ProfileDetailScreenProps> = ({
  userId,
}) => {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeScheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'piso'>('perfil');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatRooms, setFlatRooms] = useState<Room[]>([]);
  const [flatExtras, setFlatExtras] = useState<Record<string, RoomExtras | null>>({});
  const [flatLoading, setFlatLoading] = useState(false);
  const [flatAssignments, setFlatAssignments] = useState<Record<string, boolean>>({});

  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? '';
  const routeParams = route as { params?: { profile?: Profile; fromMatch?: boolean } };
  const routeProfile = routeParams.params?.profile;
  const isFromMatch = Boolean(routeParams.params?.fromMatch);
  const isOwnProfile =
    (!routeProfile && (!userId || userId === currentUserId)) ||
    routeProfile?.id === currentUserId;

  const handleLogout = () => {
    if (!authContext?.logout) return;
    Alert.alert('Cerrar sesion', 'Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await authContext.logout();
          } finally {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (routeProfile) {
      setProfile(routeProfile);
      setLoading(false);
      if (routeProfile.id && routeProfile.id !== currentUserId) {
        profilePhotoService
          .getPhotosForProfile(routeProfile.id)
          .then((data) => setProfilePhotos(data))
          .catch((error) =>
            console.error('Error cargando fotos externas:', error)
          );
      } else {
        setProfilePhotos([]);
      }
      return;
    }

    loadProfile();
    loadPhotos();
  }, [userId, routeProfile, currentUserId]);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const data = await profilePhotoService.getPhotos();
      setProfilePhotos(data);
    } catch (error) {
      console.error('Error cargando fotos:', error);
    }
  };

  const loadFlatData = useCallback(async () => {
    if (!profile?.id || profile.housing_situation !== 'offering') {
      setActiveTab('perfil');
      setFlats([]);
      setFlatRooms([]);
      setFlatExtras({});
      return;
    }

    try {
      setFlatLoading(true);
      const [flatsData, roomsData] = await Promise.all([
        roomService.getFlatsByOwner(profile.id),
        roomService.getRoomsByOwner(profile.id),
      ]);
      setFlats(flatsData);
      setFlatRooms(roomsData);
      const extras = await roomExtrasService.getExtrasForRooms(
        roomsData.map((room) => room.id)
      );
      const extrasMap = Object.fromEntries(
        extras.map((extra) => [extra.room_id, extra])
      );
      setFlatExtras(extrasMap);
      const acceptedMap: Record<string, boolean> = {};
      await Promise.all(
        roomsData.map(async (roomItem) => {
          try {
            const assignmentsResponse =
              await roomAssignmentService.getAssignmentsForRoom(roomItem.id);
            const hasAcceptedAssignment =
              assignmentsResponse.assignments.some(
                (assignment) => assignment.status === 'accepted'
              ) ||
              assignmentsResponse.match_assignment?.status === 'accepted';
            if (hasAcceptedAssignment) {
              acceptedMap[roomItem.id] = true;
            }
          } catch (error) {
            console.warn(
              'No se pudo cargar asignaciones para la habitacion:',
              roomItem.id,
              error
            );
          }
        })
      );
      setFlatAssignments(acceptedMap);
    } catch (error) {
      console.error('Error cargando piso:', error);
    } finally {
      setFlatLoading(false);
    }
  }, [profile?.id, profile?.housing_situation]);

  useEffect(() => {
    loadFlatData();
  }, [loadFlatData]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab !== 'piso') return;
      loadFlatData();
    }, [activeTab, loadFlatData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontro el perfil</Text>
      </View>
    );
  }

  const interests = profile.interests ?? [];
  const preferredZones = profile.preferred_zones ?? [];
  const lifestyleTagsData = (profile.lifestyle_tags ?? [])
    .map((id) => lifestyleTagById.get(id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);
  const interestLabels = interests.map(
    (interest) => interestLabelById.get(interest) ?? interest
  );
  const preferredZoneLabels = preferredZones.map(
    (zone) => zoneLabelById.get(zone) ?? zone
  );
  const convivenciaItems = [
    {
      key: 'schedule',
      label: 'Horario',
      value: profile.lifestyle_preferences?.schedule,
      icon: 'time-outline',
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      key: 'cleaning',
      label: 'Limpieza',
      value: profile.lifestyle_preferences?.cleaning,
      icon: 'star-outline',
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    {
      key: 'guests',
      label: 'Invitados',
      value: profile.lifestyle_preferences?.guests,
      icon: 'people-outline',
      color: '#16A34A',
      bg: '#DCFCE7',
    },
  ].filter((item) => item.value);

  const formatBudget = () => {
    if (profile.budget_min != null && profile.budget_max != null) {
      return `${profile.budget_min} - ${profile.budget_max} EUR`;
    }
    if (profile.budget_min != null) {
      return `Desde ${profile.budget_min} EUR`;
    }
    if (profile.budget_max != null) {
      return `Hasta ${profile.budget_max} EUR`;
    }
    return '-';
  };

  const aboutText = profile.bio ?? 'Sin descripcion por ahora.';
  const housingBadge =
    profile.housing_situation === 'seeking'
      ? 'Busco piso'
      : profile.housing_situation === 'offering'
      ? `Tengo piso en ${preferredZoneLabels[0] ?? 'zona preferida'}`
      : null;
  const memberSinceYear = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;
  const birthDateString = isOwnProfile
    ? profile.birth_date ?? authContext?.user?.birth_date ?? null
    : profile.birth_date ?? null;
  const birthDateValue = birthDateString
    ? (() => {
        const date = new Date(birthDateString);
        if (Number.isNaN(date.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const monthDelta = today.getMonth() - date.getMonth();
        if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
          age -= 1;
        }
        return `${age} años`;
      })()
    : null;
  const shouldShowFlatTab = profile.housing_situation === 'offering';

  const resolvedAvatarUrl =
    profile.avatar_url && !profile.avatar_url.startsWith('http')
      ? `${API_CONFIG.SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
      : profile.avatar_url;
  const carouselPhotos =
    profilePhotos.length > 0
      ? profilePhotos
      : resolvedAvatarUrl
      ? [
          {
            id: 'avatar',
            profile_id: profile.id,
            path: resolvedAvatarUrl,
            position: 1,
            is_primary: true,
            signedUrl: resolvedAvatarUrl,
            created_at: profile.updated_at,
          },
        ]
      : [];

  const headerHeight = insets.top + 56;

  return (
    <View style={styles.container}>
      {/* ── Glass header (absolute overlay) ─────────────────── */}
      <View style={[styles.glassHeader, { paddingTop: insets.top + 8 }]}>
        <BlurView
          style={styles.glassHeaderBlur}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={18}
          reducedTransparencyFallbackColor={isDark ? 'rgba(15,23,42,0.95)' : 'rgba(242,242,247,0.95)'}
        />
        <View style={styles.glassHeaderTint} />
        <TouchableOpacity
          style={styles.glassHeaderBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.glassHeaderSpacer} />
        {isOwnProfile ? (
          <View style={styles.glassHeaderActions}>
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={toggleTheme}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glassIconBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.glassIconBtn, styles.glassIconDanger]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero carousel ─────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {carouselPhotos.length > 0 ? (
            <FlatList
              data={carouselPhotos}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setActiveHeroIndex(index);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => {
                    setLightboxUrl(item.signedUrl);
                    setLightboxVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: item.signedUrl }}
                    style={styles.heroImage}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="person" size={56} color={theme.colors.disabled} />
            </View>
          )}

          {/* Dots */}
          {carouselPhotos.length > 1 && (
            <View style={[styles.heroDots, { top: headerHeight + 12 }]}>
              {carouselPhotos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.heroDot,
                    index === activeHeroIndex && styles.heroDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Name / info floating overlay */}
          <View style={styles.heroOverlay} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.58)']}
              style={styles.heroGradient}
            />
            <Text style={styles.heroName}>
              {profile.display_name ?? 'Usuario'}
            </Text>
            <View style={styles.heroChipsRow}>
              {birthDateValue ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{birthDateValue}</Text>
                </View>
              ) : null}
              {profile.occupation ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{profile.occupation}</Text>
                </View>
              ) : null}
              {housingBadge ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{housingBadge}</Text>
                </View>
              ) : null}
              {memberSinceYear ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>
                    Desde {memberSinceYear}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Sections ──────────────────────────────────────── */}
        <View style={styles.sectionsWrapper}>
          {/* Tab switcher */}
          {shouldShowFlatTab && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'perfil' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('perfil')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'perfil' && styles.tabTextActive,
                  ]}
                >
                  Perfil
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'piso' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('piso')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'piso' && styles.tabTextActive,
                  ]}
                >
                  Piso
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'perfil' && (
            <>
              {/* Bio */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Sobre mi</Text>
                <View style={styles.glassCard}>
                  <View style={styles.glassCardInner}>
                    <Text style={styles.aboutText}>{aboutText}</Text>
                  </View>
                </View>
              </View>

              {/* Info rápida: ocupación, universidad, presupuesto */}
              {(profile.occupation || profile.university || formatBudget() !== '-') && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Un poco sobre mi</Text>
                  <View style={styles.compactChips}>
                    {profile.occupation ? (
                      <View style={styles.compactChip}>
                        <Text style={styles.compactChipText}>
                          {profile.occupation}
                        </Text>
                      </View>
                    ) : null}
                    {profile.university ? (
                      <View style={styles.compactChip}>
                        <Text style={styles.compactChipText}>
                          {profile.university}
                        </Text>
                      </View>
                    ) : null}
                    {formatBudget() !== '-' ? (
                      <View style={styles.compactChip}>
                        <Text style={styles.compactChipText}>
                          {formatBudget()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Intereses */}
              {interestLabels.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Intereses</Text>
                  <View style={styles.compactChips}>
                    {interestLabels.map((label, index) => (
                      <View
                        key={`interest-${index}`}
                        style={[styles.compactChip, styles.purpleChip]}
                      >
                        <Text
                          style={[styles.compactChipText, styles.purpleChipText]}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Convivencia */}
              {convivenciaItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Convivencia</Text>
                  <View style={styles.glassCard}>
                    <View style={styles.glassCardInner}>
                      {convivenciaItems.map((item, index) => (
                        <View
                          key={item.key}
                          style={[
                            styles.infoRow,
                            index === convivenciaItems.length - 1 &&
                              styles.infoRowLast,
                          ]}
                        >
                          <View
                            style={[
                              styles.infoIconBox,
                              { backgroundColor: item.bg },
                            ]}
                          >
                            <Ionicons
                              name={item.icon as any}
                              size={16}
                              color={item.color}
                            />
                          </View>
                          <Text style={styles.infoLabel}>{item.label}</Text>
                          <Text style={styles.infoValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Estilo de vida */}
              {lifestyleTagsData.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Estilo de vida</Text>
                  <View style={styles.compactChips}>
                    {lifestyleTagsData.map((tag) => (
                      <View
                        key={tag.id}
                        style={[styles.compactChip, styles.purpleChip]}
                      >
                        <Text style={styles.compactChipEmoji}>{tag.emoji}</Text>
                        <Text style={[styles.compactChipText, styles.purpleChipText]}>
                          {tag.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Zonas de interés */}
              {preferredZoneLabels.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Zonas de interés</Text>
                  <View style={styles.compactChips}>
                    {preferredZoneLabels.map((zone, index) => (
                      <View key={`zone-${index}`} style={styles.compactChip}>
                        <Text style={styles.compactChipText}>{zone}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Gestión de habitaciones (perfil propio) */}
              {isOwnProfile && profile.housing_situation === 'offering' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Mis habitaciones</Text>
                  <View style={styles.manageCard}>
                    <View style={styles.manageInfo}>
                      <Text style={styles.manageTitle}>
                        Administra tus anuncios
                      </Text>
                      <Text style={styles.manageSubtitle}>
                        Edita detalles, pausa publicaciones y revisa
                        interesados.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.manageButton}
                      onPress={() => navigation.navigate('RoomManagement')}
                    >
                      <Text style={styles.manageButtonText}>Gestionar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'piso' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Piso</Text>
              {flatLoading ? (
                <Text style={styles.mutedText}>Cargando piso...</Text>
              ) : flats.length === 0 ? (
                <Text style={styles.mutedText}>No hay piso publicado.</Text>
              ) : (
                <View style={styles.flatList}>
                  {flats.map((flat) => {
                    const roomsForFlat = flatRooms.filter(
                      (room) => room.flat_id === flat.id
                    );
                    const commonAreas = roomsForFlat.filter(
                      (room) => flatExtras[room.id]?.category === 'area_comun'
                    );
                    const bedrooms = roomsForFlat.filter(
                      (room) => flatExtras[room.id]?.category !== 'area_comun'
                    );
                    const rules = flat.rules
                      ? flat.rules
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean)
                      : [];
                    const services = flat.services ?? [];

                    return (
                      <View key={flat.id} style={styles.flatCard}>
                        <Text style={styles.flatTitle}>{flat.address}</Text>
                        <Text style={styles.flatMeta}>
                          {flat.city}
                          {flat.district ? ` - ${flat.district}` : ''}
                        </Text>

                        {rules.length > 0 && (
                          <View style={styles.flatSection}>
                            <Text style={styles.flatSectionTitle}>Reglas</Text>
                            <View style={styles.listContainer}>
                              {rules.map((rule) => (
                                <Text key={rule} style={styles.listItem}>
                                  {getRuleIcon(rule)} {rule}
                                </Text>
                              ))}
                            </View>
                          </View>
                        )}

                        {services.length > 0 && (
                          <View style={styles.flatSection}>
                            <Text style={styles.flatSectionTitle}>
                              Servicios
                            </Text>
                            <View style={styles.listContainer}>
                              {services.map((service) => (
                                <Text key={service.name} style={styles.listItem}>
                                  {getServiceIcon(service.name)} {service.name}
                                  {service.price != null
                                    ? ` (${service.price} EUR)`
                                    : ''}
                                </Text>
                              ))}
                            </View>
                          </View>
                        )}

                        {bedrooms.length > 0 && (
                          <View style={styles.flatSection}>
                            <Text style={styles.flatSectionTitle}>
                              Habitaciones
                            </Text>
                            <View style={styles.roomList}>
                              {bedrooms.map((room) => {
                                const extras = flatExtras[room.id];
                                const photo =
                                  extras?.photos?.[0]?.signedUrl ?? '';
                                const typeLabel = extras?.room_type
                                  ? roomTypeLabel.get(extras.room_type) ??
                                    extras.room_type
                                  : '';
                                const statusLabel = flatAssignments[room.id]
                                  ? 'Ocupada'
                                  : room.is_available === true
                                  ? 'Disponible'
                                  : room.is_available === false
                                  ? 'Ocupada'
                                  : 'Sin estado';
                                return (
                                  <TouchableOpacity
                                    key={room.id}
                                    style={styles.roomCard}
                                    onPress={() =>
                                      navigation.navigate('RoomDetail', {
                                        room,
                                        extras,
                                        flat,
                                      })
                                    }
                                  >
                                    {photo ? (
                                      <Image
                                        source={{ uri: photo }}
                                        style={styles.roomPhoto}
                                      />
                                    ) : (
                                      <View style={styles.roomPhotoPlaceholder}>
                                        <Ionicons
                                          name="image-outline"
                                          size={20}
                                          color={theme.colors.textTertiary}
                                        />
                                      </View>
                                    )}
                                    <View style={styles.roomInfo}>
                                      <Text style={styles.roomTitle}>
                                        {room.title}
                                      </Text>
                                      {room.price_per_month != null ? (
                                        <Text style={styles.roomMeta}>
                                          {room.price_per_month} EUR/mes
                                        </Text>
                                      ) : null}
                                      {typeLabel ? (
                                        <Text style={styles.roomMeta}>
                                          Tipo: {typeLabel}
                                        </Text>
                                      ) : null}
                                      <Text style={styles.roomMeta}>
                                        {statusLabel}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}

                        {commonAreas.length > 0 && (
                          <View style={styles.flatSection}>
                            <Text style={styles.flatSectionTitle}>
                              Zonas comunes
                            </Text>
                            <View style={styles.roomList}>
                              {commonAreas.map((room) => {
                                const extras = flatExtras[room.id];
                                const photo =
                                  extras?.photos?.[0]?.signedUrl ?? '';
                                const typeLabel =
                                  extras?.common_area_type === 'otros'
                                    ? extras?.common_area_custom
                                    : extras?.common_area_type
                                    ? commonAreaLabel.get(
                                        extras.common_area_type
                                      ) ?? extras.common_area_type
                                    : '';
                                return (
                                  <TouchableOpacity
                                    key={room.id}
                                    style={styles.roomCard}
                                    onPress={() =>
                                      navigation.navigate('RoomDetail', {
                                        room,
                                        extras,
                                        flat,
                                      })
                                    }
                                  >
                                    {photo ? (
                                      <Image
                                        source={{ uri: photo }}
                                        style={styles.roomPhoto}
                                      />
                                    ) : (
                                      <View style={styles.roomPhotoPlaceholder}>
                                        <Ionicons
                                          name="image-outline"
                                          size={20}
                                          color={theme.colors.textTertiary}
                                        />
                                      </View>
                                    )}
                                    <View style={styles.roomInfo}>
                                      <Text style={styles.roomTitle}>
                                        {room.title}
                                      </Text>
                                      {typeLabel ? (
                                        <Text style={styles.roomMeta}>
                                          Tipo: {typeLabel}
                                        </Text>
                                      ) : null}
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating action bar (like / dislike) ────────────── */}
      {!isOwnProfile && !isFromMatch && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
          <BlurView
            style={styles.actionBarBlur}
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={18}
            reducedTransparencyFallbackColor={isDark ? 'rgba(15,23,42,0.95)' : 'rgba(242,242,247,0.95)'}
          />
          <View style={styles.actionBarTint} />
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnReject]}>
            <BlurView
              style={styles.actionBtnBlur}
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={14}
              reducedTransparencyFallbackColor={isDark ? 'rgba(31,41,55,0.80)' : 'rgba(255,255,255,0.80)'}
            />
            <View style={styles.actionBtnTintReject} />
            <Ionicons name="close" size={26} color={theme.colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLike]}>
            <BlurView
              style={styles.actionBtnBlur}
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={14}
              reducedTransparencyFallbackColor={isDark ? 'rgba(31,41,55,0.80)' : 'rgba(255,255,255,0.80)'}
            />
            <View style={styles.actionBtnTintLike} />
            <Ionicons name="heart" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Lightbox modal ──────────────────────────────────── */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={styles.lightboxBackdrop}
            activeOpacity={1}
            onPress={() => setLightboxVisible(false)}
          />
          <View style={styles.lightboxContent}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setLightboxVisible(false)}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {lightboxUrl && (
              <Image
                source={{ uri: lightboxUrl }}
                style={styles.lightboxImage}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
