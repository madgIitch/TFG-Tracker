import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthContext } from '../context/AuthContext';
import { supabaseClient } from '../services/authService';
import { roomExtrasService } from '../services/roomExtrasService';
import { roomAssignmentService } from '../services/roomAssignmentService';
import { roomService } from '../services/roomService';
import type { Flat, Room, RoomExtras } from '../types/room';
import { SCREEN_WIDTH, styles } from './RoomDetailScreen.styles';

type RouteParams = {
  room: Room;
  extras?: RoomExtras | null;
  flat?: Flat | null;
};

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

export const RoomDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? '';
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const { room, extras, flat } = route.params as RouteParams;
  const [roomState, setRoomState] = useState(room);
  const [extrasState, setExtrasState] = useState<RoomExtras | null>(
    extras ?? null
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isAssigned, setIsAssigned] = useState(false);
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const roomDetailChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;

    const refreshRoom = async () => {
      try {
        const isOwner = room.owner_id === currentUserId;
        const assignmentsResponse =
          await roomAssignmentService.getAssignmentsForRoom(room.id);

        if (isOwner) {
          const rooms = await roomService.getRoomsByOwner(room.owner_id);
          const updated = rooms.find((item) => item.id === room.id);
          if (updated && isMounted) {
            setRoomState(updated);
          }
        } else {
          try {
            const updated = await roomService.getRoomById(room.id);
            if (updated && isMounted) {
              setRoomState(updated);
            }
          } catch (error) {
            console.warn(
              'No se pudo refrescar la habitacion para no-dueno:',
              room.id,
              error
            );
          }
        }

        const extrasData = await roomExtrasService.getExtrasForRooms([room.id]);
        if (isMounted) {
          setExtrasState(extrasData[0] ?? null);
          const assigned =
            assignmentsResponse.assignments.some(
              (assignment) =>
                assignment.room_id === room.id && assignment.status === 'accepted'
            ) || assignmentsResponse.match_assignment?.status === 'accepted';
          setIsAssigned(assigned);
        }
      } catch (error) {
        console.error('Error cargando detalle de habitacion:', error);
      }
    };

    refreshRoom();
    return () => {
      isMounted = false;
    };
  }, [room.id, room.owner_id, currentUserId, realtimeVersion]);

  // Supabase Realtime: actualizar cuando alguien entra o sale de la habitación
  useEffect(() => {
    const setupRealtime = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (roomDetailChannelRef.current) {
        supabaseClient.removeChannel(roomDetailChannelRef.current);
      }

      const channel = supabaseClient
        .channel(`room-detail-${room.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'room_assignments' },
          (payload) => {
            const row = payload.new as { room_id?: string };
            if (row.room_id !== room.id) return;
            setRealtimeVersion((v) => v + 1);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'room_assignments' },
          (payload) => {
            const row = payload.new as { room_id?: string };
            if (row.room_id !== room.id) return;
            setRealtimeVersion((v) => v + 1);
          }
        )
        .subscribe();

      roomDetailChannelRef.current = channel;
    };

    void setupRealtime();

    return () => {
      if (roomDetailChannelRef.current) {
        supabaseClient.removeChannel(roomDetailChannelRef.current);
        roomDetailChannelRef.current = null;
      }
    };
  }, [room.id]);

  const photos = extrasState?.photos ?? [];
  const isCommonArea = extrasState?.category === 'area_comun';
  const isOwner = room.owner_id === currentUserId;

  const typeLabel = useMemo(() => {
    if (!extrasState) return null;
    if (extrasState.category === 'area_comun') {
      if (extrasState.common_area_type === 'otros') {
        return extrasState.common_area_custom ?? null;
      }
      return extrasState.common_area_type
        ? commonAreaLabel.get(extrasState.common_area_type) ??
            extrasState.common_area_type
        : null;
    }
    return extrasState.room_type
      ? roomTypeLabel.get(extrasState.room_type) ?? extrasState.room_type
      : null;
  }, [extrasState]);

  const rules = flat?.rules
    ? flat.rules
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const services = flat?.services ?? [];
  const statusLabel = !isCommonArea
    ? isAssigned
      ? 'Ocupada'
      : roomState.is_available === true
      ? 'Disponible'
      : roomState.is_available === false
      ? 'Ocupada'
      : 'Sin estado'
    : null;
  const statusTone =
    statusLabel === 'Disponible'
      ? styles.statusPillAvailable
      : styles.statusPillOccupied;

  const ctaDisabled = isAssigned || roomState.is_available !== true;
  const ctaLabel = isAssigned
    ? 'Ya eres inquilino'
    : roomState.is_available === true
    ? 'Pedir unirme'
    : 'No disponible';

  const headerHeight = insets.top + 56;

  return (
    <View style={styles.container}>
      {/* ── Glass header (absolute overlay) ─────────────────── */}
      <View style={[styles.glassHeader, { paddingTop: insets.top + 8 }]}>
        <BlurView
          style={styles.glassHeaderBlur}
          blurType="light"
          blurAmount={18}
          reducedTransparencyFallbackColor="rgba(242, 242, 247, 0.95)"
        />
        <View style={styles.glassHeaderTint} />
        <TouchableOpacity
          style={styles.glassHeaderBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.glassHeaderTitle} numberOfLines={1}>
          {room.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero carousel ─────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {photos.length > 0 ? (
            <>
              <FlatList
                data={photos}
                keyExtractor={(item) => item.path}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setActivePhotoIndex(index);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.signedUrl }}
                    style={styles.heroImage}
                  />
                )}
              />
              {photos.length > 1 && (
                <View style={[styles.heroDots, { top: headerHeight + 12 }]}>
                  {photos.map((photo, index) => (
                    <View
                      key={photo.path}
                      style={[
                        styles.heroDot,
                        index === activePhotoIndex && styles.heroDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="bed-outline" size={56} color="#D1D5DB" />
            </View>
          )}

          {/* Hero overlay: title + status badges */}
          <View style={styles.heroOverlay} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.60)']}
              style={styles.heroGradient}
            />
            <Text style={styles.heroTitle}>{room.title}</Text>
            <View style={styles.heroBadgesRow}>
              {!isCommonArea && roomState.price_per_month != null && (
                <View style={[styles.heroBadge, styles.heroBadgePrimary]}>
                  <Text style={styles.heroBadgePrimaryText}>
                    {roomState.price_per_month} EUR/mes
                  </Text>
                </View>
              )}
              {!isCommonArea && statusLabel ? (
                <View
                  style={[
                    styles.heroBadge,
                    statusLabel === 'Disponible'
                      ? styles.heroBadgeGreen
                      : styles.heroBadgeRed,
                  ]}
                >
                  <Text style={styles.heroBadgeText}>{statusLabel}</Text>
                </View>
              ) : null}
              {typeLabel ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{typeLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Sections ──────────────────────────────────────── */}
        <View style={styles.sectionsWrapper}>
          {/* Room info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isCommonArea ? 'Zona común' : 'Habitación'}
            </Text>
            <View style={styles.glassCard}>
              <View style={styles.glassCardInner}>
                {typeLabel ? (
                  <View style={styles.infoRow}>
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#EEF2FF' }]}
                    >
                      <Ionicons name="home-outline" size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.infoLabel}>Tipo</Text>
                    <Text style={styles.infoValue}>{typeLabel}</Text>
                  </View>
                ) : null}
                {!isCommonArea && roomState.price_per_month != null ? (
                  <View style={styles.infoRow}>
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#F0FDF4' }]}
                    >
                      <Ionicons name="card-outline" size={16} color="#16A34A" />
                    </View>
                    <Text style={styles.infoLabel}>Precio</Text>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>
                        {roomState.price_per_month} EUR/mes
                      </Text>
                    </View>
                  </View>
                ) : null}
                {!isCommonArea && statusLabel ? (
                  <View style={styles.infoRow}>
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#F3E8FF' }]}
                    >
                      <Ionicons name="pulse-outline" size={16} color="#7C3AED" />
                    </View>
                    <Text style={styles.infoLabel}>Estado</Text>
                    <View style={[styles.statusPill, statusTone]}>
                      <Text style={styles.statusPillText}>{statusLabel}</Text>
                    </View>
                  </View>
                ) : null}
                {roomState.size_m2 != null ? (
                  <View
                    style={[
                      styles.infoRow,
                      !roomState.description && styles.infoRowLast,
                    ]}
                  >
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#FFF7ED' }]}
                    >
                      <Ionicons
                        name="resize-outline"
                        size={16}
                        color="#EA580C"
                      />
                    </View>
                    <Text style={styles.infoLabel}>Tamaño</Text>
                    <Text style={styles.infoValue}>{roomState.size_m2} m²</Text>
                  </View>
                ) : null}
                {roomState.description ? (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      {roomState.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Flat / location */}
          {flat && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ubicación</Text>
              <View style={styles.glassCard}>
                <View style={styles.glassCardInner}>
                  <View style={styles.infoRow}>
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#D97706"
                      />
                    </View>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text
                      style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}
                      numberOfLines={2}
                    >
                      {flat.address}
                    </Text>
                  </View>
                  <View style={[styles.infoRow, styles.infoRowLast]}>
                    <View
                      style={[styles.infoIconBox, { backgroundColor: '#DBEAFE' }]}
                    >
                      <Ionicons name="map-outline" size={16} color="#2563EB" />
                    </View>
                    <Text style={styles.infoLabel}>Zona</Text>
                    <Text style={styles.infoValue}>
                      {flat.city}
                      {flat.district ? ` - ${flat.district}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Services */}
          {services.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Servicios incluidos</Text>
              <View style={styles.chipsWrap}>
                {services.map((service) => (
                  <View key={service.name} style={styles.serviceChip}>
                    <Text style={styles.serviceChipIcon}>
                      {getServiceIcon(service.name)}
                    </Text>
                    <Text style={styles.serviceChipText}>
                      {service.name}
                      {service.price != null ? ` · ${service.price}€` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rules */}
          {rules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reglas del piso</Text>
              <View style={styles.glassCard}>
                <View style={styles.glassCardInner}>
                  {rules.map((rule, index) => (
                    <View
                      key={rule}
                      style={[
                        styles.ruleRow,
                        index === rules.length - 1 && styles.infoRowLast,
                      ]}
                    >
                      <Text style={styles.ruleIcon}>{getRuleIcon(rule)}</Text>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* CTA (non-owner only) */}
          {!isOwner && (
            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  ctaDisabled && styles.ctaButtonDisabled,
                ]}
                disabled={ctaDisabled}
              >
                <Text
                  style={[
                    styles.ctaText,
                    ctaDisabled && styles.ctaTextDisabled,
                  ]}
                >
                  {ctaLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
