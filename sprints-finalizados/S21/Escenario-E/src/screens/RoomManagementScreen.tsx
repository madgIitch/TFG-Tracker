import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Clipboard,
  Share,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { supabaseClient } from '../services/authService';
import { FormSection } from '../components/FormSection';
import { AuthContext } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { roomService } from '../services/roomService';
import { roomExtrasService } from '../services/roomExtrasService';
import { roomAssignmentService } from '../services/roomAssignmentService';
import type { Flat, Room, RoomExtras } from '../types/room';
import type { RoomAssignment } from '../types/roomAssignment';
import type { Gender } from '../types/gender';
import { invitationCodeService, GeneratedCode } from '../services/invitationCodeService';
import { makeStyles } from './RoomManagementScreen.styles';

type RoomStatus = 'available' | 'paused';

type RoomExtrasMap = Record<string, RoomExtras | null>;
type RoomAssignmentsMap = Record<string, RoomAssignment[]>;

const toISODate = (date: Date) => date.toISOString().split('T')[0];

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
    if (normalized.includes('banos') || normalized.includes('baños')) return 'banos';
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

const getRoomStatus = (
  room: Room,
  isAssigned: boolean
): { label: string; key: RoomStatus } => {
  if (isAssigned) {
    return { label: 'Ocupada', key: 'paused' };
  }
  if (room.is_available) {
    return { label: 'Disponible', key: 'available' };
  }

  return { label: 'Ocupada', key: 'paused' };
};

export const RoomManagementScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const authContext = useContext(AuthContext);
  const userGender = authContext?.user?.gender ?? null;
  const [profileGender, setProfileGender] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(true);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomExtras, setRoomExtras] = useState<RoomExtrasMap>({});
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignmentsMap>({});
  const [updatingGenderPolicy, setUpdatingGenderPolicy] = useState(false);
  const [invitationModal, setInvitationModal] = useState<(GeneratedCode & { roomTitle: string }) | null>(null);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const roomMgmtChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfileGender = async () => {
      try {
        const profile = await profileService.getProfile();
        if (isMounted) {
          setProfileGender(profile?.gender ?? null);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    void loadProfileGender();
    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedGender = profileGender ?? userGender;
  const allowedPolicies = useMemo(() => {
    if (resolvedGender === 'male') {
      return new Set<Flat['gender_policy']>(['men_only', 'mixed']);
    }
    if (!resolvedGender || resolvedGender === 'undisclosed') {
      return new Set<Flat['gender_policy']>(['men_only', 'mixed', 'flinta']);
    }
    return new Set<Flat['gender_policy']>(['flinta', 'mixed']);
  }, [resolvedGender]);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomService.getMyRooms();
      setRooms(data);

      const extras = await roomExtrasService.getExtrasForRooms(
        data.map((room) => room.id)
      );
      setRoomExtras(
        Object.fromEntries(extras.map((item) => [item.room_id, item]))
      );

      const assignmentsResponse = await roomAssignmentService.getAssignmentsForOwner();
      const assignmentsByRoom: RoomAssignmentsMap = {};
      assignmentsResponse.assignments.forEach((assignment) => {
        if (!assignmentsByRoom[assignment.room_id]) {
          assignmentsByRoom[assignment.room_id] = [];
        }
        assignmentsByRoom[assignment.room_id].push(assignment);
      });
      setRoomAssignments(assignmentsByRoom);
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las habitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFlats = useCallback(async () => {
    try {
      const data = await roomService.getMyFlats();
      setFlats(data);
    } catch (error) {
      console.error('Error cargando pisos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pisos');
    }
  }, [selectedFlatId]);

  useFocusEffect(
    useCallback(() => {
      loadFlats();
      loadRooms();
    }, [loadRooms, loadFlats])
  );

  useEffect(() => {
    if (flats.length === 0) {
      setSelectedFlatId(null);
      return;
    }
    if (!selectedFlatId || !flats.some((flat) => flat.id === selectedFlatId)) {
      setSelectedFlatId(flats[0].id);
    }
  }, [flats, selectedFlatId]);

  // Supabase Realtime: actualización automática al cambiar habitaciones o asignaciones
  useEffect(() => {
    if (!selectedFlatId) return;

    const setupRealtime = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (roomMgmtChannelRef.current) {
        supabaseClient.removeChannel(roomMgmtChannelRef.current);
      }

      const channel = supabaseClient
        .channel(`room-mgmt-${selectedFlatId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'rooms' },
          (payload) => {
            const row = payload.new as { flat_id?: string };
            if (row.flat_id !== selectedFlatId) return;
            void loadRooms();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms' },
          (payload) => {
            const row = payload.new as { flat_id?: string };
            if (row.flat_id !== selectedFlatId) return;
            void loadRooms();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'rooms' },
          () => {
            void loadRooms();
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'room_assignments' },
          () => {
            void loadRooms();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'room_assignments' },
          () => {
            void loadRooms();
          }
        )
        .subscribe();

      roomMgmtChannelRef.current = channel;
    };

    void setupRealtime();

    return () => {
      if (roomMgmtChannelRef.current) {
        supabaseClient.removeChannel(roomMgmtChannelRef.current);
        roomMgmtChannelRef.current = null;
      }
    };
  }, [selectedFlatId, loadRooms]);

  const handleToggleAvailability = async (room: Room) => {
    const nextAvailable = !room.is_available;
    const availableFrom =
      room.available_from || toISODate(new Date());

    try {
      await roomService.updateRoom(room.id, {
        flat_id: room.flat_id,
        title: room.title,
        description: room.description,
        price_per_month: room.price_per_month,
        size_m2: room.size_m2,
        is_available: nextAvailable,
        available_from: availableFrom,
      });
      await loadRooms();
    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
      Alert.alert('Error', 'No se pudo actualizar la habitacion');
    }
  };

  const handleEditRoom = (room: Room) => {
    navigation.navigate('RoomEdit', { room });
  };

  const handleViewInterests = (room: Room) => {
    navigation.navigate('RoomInterests', {
      roomId: room.id,
      roomTitle: room.title,
    });
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      'Eliminar habitacion',
      'Esta accion no se puede deshacer. ?Quieres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await roomService.deleteRoom(room.id);
              await loadRooms();
            } catch (error) {
              console.error('Error eliminando habitacion:', error);
              Alert.alert('Error', 'No se pudo eliminar la habitacion');
            }
          },
        },
      ]
    );
  };

  const handleCreateRoom = () => {
    if (!selectedFlatId) {
      Alert.alert('Aviso', 'Debes crear un piso antes de añadir habitaciones.');
      return;
    }
    navigation.navigate('RoomEdit', { flatId: selectedFlatId });
  };

  const handleGenerateCode = async (room: Room) => {
    setGeneratingCode(room.id);
    try {
      const result = await invitationCodeService.generate(room.id);
      setInvitationModal({ ...result, roomTitle: room.title });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el código de invitación');
    } finally {
      setGeneratingCode(null);
    }
  };

  const handleUpdateGenderPolicy = async (policy: Flat['gender_policy']) => {
    if (!selectedFlatId || !policy) return;
    if (!allowedPolicies.has(policy)) {
      Alert.alert(
        'Restriccion',
        'Esta opcion no esta disponible segun tu genero.'
      );
      return;
    }

    const currentPolicy = selectedFlat?.gender_policy ?? 'mixed';
    if (currentPolicy === policy) return;

    try {
      setUpdatingGenderPolicy(true);
      const updatedFlat = await roomService.updateFlat(selectedFlatId, {
        gender_policy: policy,
      });
      setFlats((prev) =>
        prev.map((flat) => (flat.id === updatedFlat.id ? updatedFlat : flat))
      );
    } catch (error) {
      console.error('Error actualizando tipo de convivencia:', error);
      Alert.alert('Error', 'No se pudo actualizar el tipo de convivencia');
    } finally {
      setUpdatingGenderPolicy(false);
    }
  };

  const selectedFlat = flats.find((flat) => flat.id === selectedFlatId) || null;
  const selectedFlatRules = selectedFlat?.rules
    ? selectedFlat.rules
        .split('\n')
        .map((rule) => rule.trim())
        .filter(Boolean)
    : [];
  const filteredRooms = selectedFlatId
    ? rooms.filter((room) => room.flat_id === selectedFlatId)
    : rooms;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Gestion de habitaciones
        </Text>
        {flats.length > 0 ? (
          <TouchableOpacity onPress={handleCreateRoom} style={styles.headerAction}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
            <Text style={styles.headerActionText}>Nueva</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {flats.length === 0 ? (
            <View style={styles.createFlatCard}>
              <Ionicons name="home-outline" size={42} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Aun no tienes un piso creado</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primer piso para empezar a publicar habitaciones.
              </Text>
              <TouchableOpacity
                style={styles.createFlatButton}
                onPress={() => navigation.navigate('CreateFlat')}
              >
                <Text style={styles.createFlatButtonText}>Crear piso</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.flatSelector}>
                <Text style={styles.flatSelectorLabel}>Pisos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.flatChips}>
                  {flats.map((flat) => {
                    const isActive = flat.id === selectedFlatId;
                    return (
                      <TouchableOpacity
                        key={flat.id}
                        style={[
                          styles.flatChip,
                          isActive && styles.flatChipActive,
                        ]}
                        onPress={() => setSelectedFlatId(flat.id)}
                      >
                        <Text
                          style={[
                            styles.flatChipText,
                            isActive && styles.flatChipTextActive,
                          ]}
                        >
                          {flat.address}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.flatChip, styles.flatChipAdd]}
                    onPress={() => navigation.navigate('CreateFlat')}
                  >
                    <Ionicons name="add" size={14} color="#7C3AED" />
                    <Text style={styles.flatChipAddText}>Nuevo piso</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

              <FormSection title="Gastos del piso" iconName="wallet-outline">
                <Text style={styles.detailEmpty}>
                  Gestiona los gastos compartidos y liquidaciones entre compañeros.
                </Text>
                <View style={styles.expenseButtonsRow}>
                  <TouchableOpacity
                    style={styles.expenseButton}
                    onPress={() =>
                      selectedFlatId
                        ? navigation.navigate('FlatExpenses', {
                            flatId: selectedFlatId,
                            flatAddress: selectedFlat?.address,
                          })
                        : Alert.alert('Aviso', 'Selecciona un piso primero.')
                    }
                  >
                    <Ionicons name="receipt-outline" size={15} color="#7C3AED" />
                    <Text style={styles.inlineActionText}>Ver gastos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.expenseButton}
                    onPress={() =>
                      selectedFlatId
                        ? navigation.navigate('FlatSettlement', {
                            flatId: selectedFlatId,
                            flatAddress: selectedFlat?.address,
                          })
                        : Alert.alert('Aviso', 'Selecciona un piso primero.')
                    }
                  >
                    <Ionicons name="calculator-outline" size={15} color="#7C3AED" />
                    <Text style={styles.inlineActionText}>Liquidaciones</Text>
                  </TouchableOpacity>
                </View>
              </FormSection>

              <FormSection title="Reglas" iconName="clipboard-outline">
                {selectedFlatRules.length > 0 ? (
                  <View style={styles.rulesList}>
                    {selectedFlatRules.map((rule) => (
                      <Text key={rule} style={styles.detailText}>
                        {getRuleIcon(rule)} {rule}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailEmpty}>
                    Aun no has definido reglas del piso.
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.inlineAction}
                  onPress={() =>
                    selectedFlatId
                      ? navigation.navigate('RulesManagement', {
                          flatId: selectedFlatId,
                        })
                      : Alert.alert('Aviso', 'Selecciona un piso primero.')
                  }
                >
                  <Text style={styles.inlineActionText}>
                    {selectedFlat?.rules ? 'Editar reglas' : 'Agregar reglas'}
                  </Text>
                </TouchableOpacity>
              </FormSection>

              <FormSection title="Servicios" iconName="flash-outline">
                {selectedFlat?.services && selectedFlat.services.length > 0 ? (
                  <View style={styles.servicesList}>
                    {selectedFlat.services.map((service, index) => (
                      <View key={`${service.name}-${index}`} style={styles.serviceRow}>
                        <Text style={styles.detailText}>
                          {getServiceIcon(service.name)} {service.name}
                        </Text>
                        {service.price != null && service.price !== 0 ? (
                          <Text style={styles.detailMeta}>{service.price} EUR</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.detailEmpty}>
                    Aun no has definido servicios incluidos.
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.inlineAction}
                  onPress={() =>
                    selectedFlatId
                      ? navigation.navigate('ServicesManagement', {
                          flatId: selectedFlatId,
                        })
                      : Alert.alert('Aviso', 'Selecciona un piso primero.')
                  }
                >
                  <Text style={styles.inlineActionText}>
                    {selectedFlat?.services?.length
                      ? 'Editar servicios'
                      : 'Agregar servicios'}
                  </Text>
                </TouchableOpacity>
              </FormSection>

              <FormSection title="Tipo de convivencia" iconName="people-outline">
                <View style={styles.segmentRow}>
                  {[
                    { id: 'mixed' as const, label: 'Mixto' },
                    { id: 'men_only' as const, label: 'Solo hombres' },
                    { id: 'flinta' as const, label: 'FLINTA' },
                  ].map((option) => {
                    const currentPolicy = selectedFlat?.gender_policy ?? 'mixed';
                    const isActive = currentPolicy === option.id;
                    const isDisabled =
                      updatingGenderPolicy || !allowedPolicies.has(option.id);
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.segmentButton,
                          isActive && styles.segmentButtonActive,
                          isDisabled && styles.segmentButtonDisabled,
                        ]}
                        onPress={() => handleUpdateGenderPolicy(option.id)}
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isActive && styles.segmentButtonTextActive,
                            isDisabled && styles.segmentButtonTextDisabled,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.sectionHint}>
                  FLINTA: mujeres, personas no binarias y otras identidades;
                  hombres no.
                </Text>
              </FormSection>

              <FormSection title="Habitaciones" iconName="bed-outline">
                <TouchableOpacity
                  style={styles.inlineAction}
                  onPress={handleCreateRoom}
                >
                  <Text style={styles.inlineActionText}>Agregar habitacion</Text>
                </TouchableOpacity>

                {filteredRooms.length === 0 ? (
                  <View style={styles.emptyStateInline}>
                    <Ionicons name="bed-outline" size={42} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>
                      No tienes habitaciones publicadas
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Crea una habitacion para empezar a recibir interesados.
                    </Text>
                  </View>
                ) : null}

                {filteredRooms.map((room) => {
                  const extras = roomExtras[room.id];
                  const isCommonArea = extras?.category === 'area_comun';
                  const assignmentsForRoom = roomAssignments[room.id] ?? [];
                  const isAssigned = assignmentsForRoom.some(
                    (assignment) => assignment.status === 'accepted'
                  );
                  const photo = extras?.photos?.[0];
                  const typeLabel =
                    extras?.category === 'area_comun'
                      ? extras?.common_area_type === 'otros'
                        ? extras?.common_area_custom
                        : commonAreaLabel.get(extras?.common_area_type || '')
                      : roomTypeLabel.get(extras?.room_type || '');
                  const typeText = typeLabel
                    ? isCommonArea
                      ? `Area comun: ${typeLabel}`
                      : `Tipo: ${typeLabel}`
                    : null;
                  const resolvedPhoto = photo?.signedUrl || null;

                  return (
                    <View key={room.id} style={styles.roomCard}>
                      <View style={styles.roomCardHeader}>
                        {resolvedPhoto ? (
                          <Image source={{ uri: resolvedPhoto }} style={styles.roomPhoto} />
                        ) : (
                          <View style={styles.roomPhotoPlaceholder}>
                            <Ionicons name="image-outline" size={22} color="#9CA3AF" />
                          </View>
                        )}
                        <View style={styles.roomInfo}>
                          <Text style={styles.roomTitle}>{room.title}</Text>
                          {!isCommonArea && room.price_per_month ? (
                            <Text style={styles.roomMeta}>
                              {room.price_per_month} EUR/mes
                            </Text>
                          ) : null}
                        {!isCommonArea && (
                          <Text style={styles.roomMeta}>
                            Disponible desde:{' '}
                            {room.available_from ? room.available_from : 'Sin fecha'}
                          </Text>
                        )}
                        {typeText ? (
                          <Text style={styles.roomMeta}>{typeText}</Text>
                        ) : null}
                    </View>
                    {!isCommonArea && (() => {
                      const status = getRoomStatus(room, isAssigned);
                      return (
                        <View
                          style={[
                            styles.statusBadge,
                            status.key === 'available' && styles.statusAvailable,
                            status.key === 'paused' && styles.statusPaused,
                          ]}
                        >
                          <Text style={styles.statusText}>{status.label}</Text>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditRoom(room)}
                    >
                      <Ionicons name="create-outline" size={16} color="#111827" />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>
                    {!isCommonArea && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          isAssigned && styles.actionButtonDisabled,
                        ]}
                        onPress={() => handleToggleAvailability(room)}
                        disabled={isAssigned}
                      >
                        <Ionicons
                          name={room.is_available ? 'pause' : 'play'}
                          size={16}
                          color="#111827"
                        />
                        <Text style={styles.actionText}>
                          {room.is_available ? 'Pausar' : 'Activar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!isCommonArea && !isAssigned && room.is_available && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleGenerateCode(room)}
                        disabled={generatingCode === room.id}
                      >
                        {generatingCode === room.id ? (
                          <ActivityIndicator size="small" color="#111827" />
                        ) : (
                          <Ionicons name="key-outline" size={16} color="#111827" />
                        )}
                        <Text style={styles.actionText}>Código</Text>
                      </TouchableOpacity>
                    )}
                    {!isCommonArea && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewInterests(room)}
                      >
                        <Ionicons name="heart-outline" size={16} color="#111827" />
                        <Text style={styles.actionText}>Interesados</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteRoom(room)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.actionText, styles.deleteButtonText]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </FormSection>
            </>
          )}
        </ScrollView>
      )}

      {/* Invitation code modal */}
      <Modal
        visible={invitationModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInvitationModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.codeModal}>
            <Text style={styles.codeModalTitle}>Código de invitación</Text>
            <Text style={styles.codeModalRoom}>{invitationModal?.roomTitle}</Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{invitationModal?.code}</Text>
            </View>

            <Text style={styles.codeExpiry}>
              {invitationModal
                ? `Válido hasta ${new Date(invitationModal.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : ''}
            </Text>

            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.codeActionButton}
                onPress={() => {
                  if (invitationModal?.code) {
                    Clipboard.setString(invitationModal.code);
                    Alert.alert('Copiado', 'Código copiado al portapapeles');
                  }
                }}
              >
                <Ionicons name="copy-outline" size={18} color="#7C3AED" />
                <Text style={styles.codeActionText}>Copiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.codeActionButton}
                onPress={() => {
                  if (invitationModal?.code) {
                    void Share.share({
                      message: `Tu código de invitación para HomiMatch: ${invitationModal.code}`,
                    });
                  }
                }}
              >
                <Ionicons name="share-outline" size={18} color="#7C3AED" />
                <Text style={styles.codeActionText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.codeCloseButton}
              onPress={() => setInvitationModal(null)}
            >
              <Text style={styles.codeCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

