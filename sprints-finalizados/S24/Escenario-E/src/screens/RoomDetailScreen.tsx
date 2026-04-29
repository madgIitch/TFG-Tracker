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
import { SCREEN_WIDTH, makeStyles } from './RoomDetailScreen.styles';
import { useTheme } from '../theme/ThemeContext';
import { useThemeScheme } from '../theme/ThemeContext';
import { roomTypeLabel, commonAreaLabel, SUB_RULE_TYPE_MAP, getRuleIcon, getServiceIcon } from '../constants/roomLabels';

type RouteParams = {
  room: Room;
  extras?: RoomExtras | null;
  flat?: Flat | null;
};

export const RoomDetailScreen: React.FC = () => {
  const theme = useTheme();
  const { isDark } = useThemeScheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
              <Ionicons name="camera-outline" size={44} color={theme.colors.disabled} />
              <Text style={styles.heroPlaceholderText}>Sin fotos disponibles</Text>
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
