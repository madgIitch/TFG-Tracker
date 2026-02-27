import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { chatService } from '../services/chatService';
import { supabaseClient } from '../services/authService';
import { profilePhotoService } from '../services/profilePhotoService';
import { matchService } from '../services/matchService';
import { roomAssignmentService } from '../services/roomAssignmentService';
import { roomService } from '../services/roomService';
import { roomExtrasService } from '../services/roomExtrasService';
import { AuthContext } from '../context/AuthContext';
import type { Message } from '../types/chat';
import type { Profile } from '../types/profile';
import type { MatchStatus } from '../types/chat';
import type { Room } from '../types/room';
import type { RoomExtras } from '../types/room';
import type { RoomAssignment } from '../types/roomAssignment';
import { styles } from '../styles/screens/ChatScreen.styles';

type RouteParams = {
  chatId: string;
  name: string;
  avatarUrl: string;
  profile?: Profile;
};

export const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? null;
  const { chatId, name, avatarUrl, profile } = route.params as RouteParams;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(avatarUrl);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [seekerId, setSeekerId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [matchAssignment, setMatchAssignment] = useState<RoomAssignment | null>(null);
  const [ownerRooms, setOwnerRooms] = useState<Room[]>([]);
  const [roomExtras, setRoomExtras] = useState<Record<string, RoomExtras | null>>({});
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<'seeker' | 'owner'>('seeker');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadHeaderAvatar = async () => {
      if (!profile?.id) return;
      try {
        const photos = await profilePhotoService.getPhotosForProfile(profile.id);
        const primary = photos.find((photo) => photo.is_primary) ?? photos[0];
        if (primary?.signedUrl && isMounted) {
          setHeaderAvatarUrl(primary.signedUrl);
        }
      } catch (error) {
        console.error('Error cargando avatar del chat:', error);
      }
    };

    loadHeaderAvatar();
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadMatchDetails = async () => {
      try {
        const chatDetail = await chatService.getChatDetails(chatId);
        if (!chatDetail || !isMounted) return;
        setMatchId(chatDetail.matchId);
        setMatchStatus(chatDetail.matchStatus ?? null);

        const match = await matchService.getMatch(chatDetail.matchId);
        if (!match || !isMounted) return;

        const owner =
          match.user_a?.housing_situation === 'offering'
            ? match.user_a_id
            : match.user_b?.housing_situation === 'offering'
              ? match.user_b_id
              : match.user_a_id;
        const seeker =
          owner === match.user_a_id ? match.user_b_id : match.user_a_id;

        setOwnerId(owner);
        setSeekerId(seeker);
      } catch (error) {
        console.error('Error cargando detalles del match:', error);
      }
    };

    loadMatchDetails();
    return () => {
      isMounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (!matchId) return;
    let isMounted = true;

    const loadAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const data = await roomAssignmentService.getAssignments(matchId);
        if (!isMounted) return;
        setOwnerId(data.owner_id);
        setAssignments(data.assignments);
        setMatchAssignment(data.match_assignment ?? null);
      } catch (error) {
        console.error('Error cargando asignaciones:', error);
      } finally {
        if (isMounted) {
          setLoadingAssignments(false);
        }
      }
    };

    loadAssignments();
    return () => {
      isMounted = false;
    };
  }, [matchId]);

  const isOwner = Boolean(currentUserId && ownerId === currentUserId);
  const isSeeker = Boolean(currentUserId && seekerId === currentUserId);

  const acceptedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'accepted'),
    [assignments]
  );

  const canSeeAssignees = useMemo(() => {
    if (isOwner) return true;
    if (matchAssignment?.status === 'accepted') return true;
    return acceptedAssignments.some(
      (assignment) => assignment.assignee_id === currentUserId
    );
  }, [acceptedAssignments, currentUserId, isOwner, matchAssignment?.status]);

  useEffect(() => {
    if (!ownerId) return;
    let isMounted = true;

    const loadOwnerRooms = async () => {
      try {
        setLoadingRooms(true);
        const rooms = isOwner
          ? await roomService.getMyRooms()
          : await roomService.getRoomsByOwner(ownerId);
        if (!isMounted) return;
        setOwnerRooms(rooms);
        const extras = await roomExtrasService.getExtrasForRooms(
          rooms.map((room) => room.id)
        );
        const extrasMap = Object.fromEntries(
          extras.map((extra) => [extra.room_id, extra])
        );
        setRoomExtras(extrasMap);
      } catch (error) {
        console.error('Error cargando habitaciones del owner:', error);
      } finally {
        if (isMounted) {
          setLoadingRooms(false);
        }
      }
    };

    loadOwnerRooms();
    return () => {
      isMounted = false;
    };
  }, [ownerId, isOwner, canSeeAssignees]);

  const ownerHasRoom = useMemo(
    () => acceptedAssignments.some((assignment) => assignment.assignee_id === ownerId),
    [acceptedAssignments, ownerId]
  );

  const assignedRoomIds = useMemo(
    () =>
      new Set(
        acceptedAssignments.map((assignment) => assignment.room_id)
      ),
    [acceptedAssignments]
  );
  const isChatWithSeeker = profile?.housing_situation === 'seeking';

  const privateRooms = useMemo(
    () => ownerRooms.filter((room) => roomExtras[room.id]?.category !== 'area_comun'),
    [ownerRooms, roomExtras]
  );

  const availableRooms = useMemo(() => {
    if (!isOwner) return [];
    return privateRooms.filter(
      (room) => room.is_available && !assignedRoomIds.has(room.id)
    );
  }, [isOwner, privateRooms, assignedRoomIds]);

  const assignRoom = async () => {
    if (!selectedRoomId) return;
    const targetId = assignTarget === 'owner' ? ownerId : seekerId;
    if (!targetId) return;
    if (assignTarget === 'seeker' && !matchId) return;

    try {
      const payload: { match_id?: string; room_id: string; assignee_id: string } = {
        room_id: selectedRoomId,
        assignee_id: targetId,
      };
      if (assignTarget === 'seeker' && matchId) {
        payload.match_id = matchId;
      }
      await roomAssignmentService.createAssignment(payload);
      setAssignModalVisible(false);
      setSelectedRoomId(null);
      if (matchId) {
        const data = await roomAssignmentService.getAssignments(matchId);
        setAssignments(data.assignments);
        setMatchAssignment(data.match_assignment ?? null);
        setOwnerId(data.owner_id);
      }
      if (assignTarget === 'seeker') {
        setMatchStatus('room_offer');
      }
    } catch (error) {
      console.error('Error asignando habitacion:', error);
    }
  };

  const respondToAssignment = async (status: 'accepted' | 'rejected') => {
    if (!matchAssignment || !matchId) return;
    try {
      await roomAssignmentService.updateAssignment({
        assignment_id: matchAssignment.id,
        status,
      });
      const data = await roomAssignmentService.getAssignments(matchId);
      setAssignments(data.assignments);
      setMatchAssignment(data.match_assignment ?? null);
      setMatchStatus(status === 'accepted' ? 'room_assigned' : 'room_declined');
    } catch (error) {
      console.error('Error respondiendo a asignacion:', error);
    }
  };

  const renderRoomTitle = (room: Room) => {
    const extras = roomExtras[room.id];
    if (!extras) return room.title;
    const typeLabel =
      extras.category === 'area_comun'
        ? extras.common_area_type === 'otros'
          ? extras.common_area_custom
          : extras.common_area_type
        : extras.room_type;
    if (!typeLabel) return room.title;
    return `${room.title} - ${typeLabel}`;
  };

  useEffect(() => {
    let isMounted = true;

    const subscribeToMessages = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabaseClient
        .channel(`messages:chat:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            if (!isMounted) return;
            const next = mapRealtimeMessage(payload.new, currentUserId);
            setMessages((prev) =>
              prev.some((message) => message.id === next.id)
                ? prev
                : [...prev, next]
            );
            if (!next.isMine) {
              chatService.markMessagesAsRead(chatId);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    subscribeToMessages();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(chatId);
        setMessages(data);
        await chatService.markMessagesAsRead(chatId);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      }
    };

    loadMessages();
  }, [chatId]);

  const orderedMessages = useMemo(() => {
    return [...messages];
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue('');
    try {
      const next = await chatService.sendMessage(chatId, trimmed);
      setMessages((prev) => [...prev, next]);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.isMine;
    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
        >
          <Text style={[styles.bubbleText, styles.bubbleTextDark]}>
            {item.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{item.createdAt}</Text>
            {isMine && item.status && (
              <Text style={styles.bubbleStatus}>{statusLabel(item.status)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => {
            if (profile) {
              navigation.navigate('ProfileDetail', { profile, fromMatch: true });
            }
          }}
          disabled={!profile}
        >
          <Image source={{ uri: headerAvatarUrl }} style={styles.headerAvatar} />
          <Text style={[styles.headerName, { color: theme.colors.text }]}>
            {name}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {!isChatWithSeeker && (isOwner || isSeeker) && (
        <View style={styles.assignmentPanel}>
          <View style={styles.assignmentHeader}>
            <View>
              <Text style={styles.assignmentTitle}>Gestion de habitacion</Text>
              <Text style={styles.assignmentSubtitle}>
                {isOwner ? 'Asigna habitaciones y gestiona ofertas.' : 'Revisa tu estado de habitacion.'}
              </Text>
            </View>
            {matchStatus && (
              <View style={styles.assignmentStatusPill}>
                <Text style={styles.assignmentStatusText}>
                  {matchStatusLabel(matchStatus)}
                </Text>
              </View>
            )}
          </View>
          {isOwner && (
            <View style={styles.assignActions}>
              <TouchableOpacity
                style={[
                  styles.assignButton,
                  availableRooms.length === 0 && styles.assignButtonDisabled,
                ]}
                onPress={() => {
                  setAssignTarget('seeker');
                  setSelectedRoomId(null);
                  setAssignModalVisible(true);
                }}
                disabled={availableRooms.length === 0}
              >
                <Text style={styles.assignButtonText}>Asignar habitacion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assignButton,
                  (ownerHasRoom || availableRooms.length === 0) &&
                  styles.assignButtonDisabled,
                ]}
                onPress={() => {
                  setAssignTarget('owner');
                  setSelectedRoomId(null);
                  setAssignModalVisible(true);
                }}
                disabled={ownerHasRoom || availableRooms.length === 0}
              >
                <Text style={styles.assignButtonText}>Asignarme una habitacion</Text>
              </TouchableOpacity>
            </View>
          )}
          {isSeeker && matchAssignment?.status === 'offered' && (
            <View style={styles.offerCard}>
              <Text style={styles.offerTitle}>Propuesta de habitacion</Text>
              <Text style={styles.offerSubtitle}>
                {matchAssignment.room?.title ?? 'Habitacion asignada'}
              </Text>
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={[styles.offerButton, styles.offerAccept]}
                  onPress={() => respondToAssignment('accepted')}
                >
                  <Text style={styles.offerButtonText}>Aceptar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.offerButton, styles.offerReject]}
                  onPress={() => respondToAssignment('rejected')}
                >
                  <Text style={styles.offerRejectText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {!isChatWithSeeker && (
        <View style={styles.roommatesPanel}>
          <View style={styles.roommatesHeader}>
            <Text style={styles.roommatesTitle}>Companeros y habitaciones</Text>
            <View style={styles.roommatesBadge}>
              <Text style={styles.roommatesBadgeText}>
                {privateRooms.length}
              </Text>
            </View>
          </View>
          {loadingAssignments || loadingRooms ? (
            <Text style={styles.roommatesEmpty}>Cargando...</Text>
          ) : canSeeAssignees ? (
            <>
              {acceptedAssignments.length === 0 ? (
                <Text style={styles.roommatesEmpty}>Aun no hay asignaciones.</Text>
              ) : (
                <View style={styles.roommatesList}>
                  {acceptedAssignments.map((assignment) => (
                    <View key={assignment.id} style={styles.roommateRow}>
                      <Text style={styles.roommateName}>
                        {assignment.assignee?.display_name ?? 'Companero'}
                      </Text>
                      <Text style={styles.roommateRoom}>
                        {assignment.room?.title ?? 'Habitacion'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : privateRooms.length === 0 ? (
            <Text style={styles.roommatesEmpty}>No hay habitaciones.</Text>
          ) : (
            <View style={styles.roommatesList}>
              {privateRooms.map((room) => (
                <View key={room.id} style={styles.roommateRow}>
                  <Text style={styles.roommateName}>{renderRoomTitle(room)}</Text>
                  <Text style={styles.roommateRoom}>
                    {assignedRoomIds.has(room.id) ? 'Ocupada' : 'Disponible'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <FlatList
        data={orderedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {assignTarget === 'owner' ? 'Asignarme habitacion' : 'Asignar habitacion'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Selecciona una habitacion disponible.
            </Text>
            <ScrollView style={styles.modalList}>
              {availableRooms.length === 0 ? (
                <Text style={styles.roommatesEmpty}>
                  No hay habitaciones disponibles.
                </Text>
              ) : (
                availableRooms.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  return (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.modalRoomItem,
                        isSelected && styles.modalRoomItemActive,
                      ]}
                      onPress={() => setSelectedRoomId(room.id)}
                    >
                      <Text
                        style={[
                          styles.modalRoomTitle,
                          isSelected && styles.modalRoomTitleActive,
                        ]}
                      >
                        {renderRoomTitle(room)}
                      </Text>
                      <Text style={styles.modalRoomMeta}>
                        {room.price_per_month} EUR/mes
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setAssignModalVisible(false);
                  setSelectedRoomId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  !selectedRoomId && styles.modalButtonDisabled,
                ]}
                onPress={assignRoom}
                disabled={!selectedRoomId}
              >
                <Text style={styles.modalConfirmText}>
                  {assignTarget === 'owner' ? 'Asignarme' : 'Asignar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const statusLabel = (status: Message['status']) => {
  switch (status) {
    case 'delivered':
      return 'Entregado';
    case 'read':
      return 'Leido';
    default:
      return 'Enviado';
  }
};

const matchStatusLabel = (status: MatchStatus) => {
  switch (status) {
    case 'room_offer':
      return 'Propuesta enviada';
    case 'room_assigned':
      return 'Habitacion asignada';
    case 'room_declined':
      return 'Propuesta rechazada';
    case 'accepted':
      return 'Match';
    default:
      return 'Pendiente';
  }
};

const mapRealtimeMessage = (
  payload: any,
  currentUserId: string | null
): Message => {
  const isMine = payload.sender_id === currentUserId;
  return {
    id: payload.id,
    chatId: payload.chat_id,
    text: payload.body,
    createdAt: formatChatTime(payload.created_at),
    isMine,
    status: isMine ? (payload.read_at ? 'read' : 'sent') : undefined,
    readAt: payload.read_at ?? null,
  };
};

const formatChatTime = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};
