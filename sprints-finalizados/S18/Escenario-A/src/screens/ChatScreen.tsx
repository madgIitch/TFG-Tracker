import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  EmitterSubscription,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView
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
import { colors } from '../styles/tokens';
import type { Message } from '../types/chat';
import type { Profile } from '../types/profile';
import type { MatchStatus } from '../types/chat';
import type { Room } from '../types/room';
import type { RoomExtras } from '../types/room';
import type { RoomAssignment } from '../types/roomAssignment';
import styles from '../styles/screens/ChatScreen.styles';
import { GlassBackground } from '../components/GlassBackground';
import { setActiveChatId } from '../utils/activeChatRef';

type RouteParams = {
  chatId: string;
  name: string;
  avatarUrl: string;
  profile?: Profile;
};

type DayRow = {
  id: string;
  type: 'day';
  label: string;
};

type MessageRow = {
  id: string;
  type: 'message';
  message: Message;
};

type ChatRow = DayRow | MessageRow;

export const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pendingNewMessages, setPendingNewMessages] = useState(0);
  const listRef = useRef<FlatList<ChatRow> | null>(null);
  const isAtBottomRef = useRef(true);
  const inputOffset = Math.max(insets.bottom, 12);
  const messagesContentStyle = useMemo(
    () => [styles.messagesList, { paddingBottom: 14 + inputOffset }],
    [inputOffset]
  );
  const inputRowStyle = useMemo(
    () => [
      styles.inputRow,
      { paddingBottom: inputOffset },
      Platform.OS === 'android' && keyboardHeight > 0
        ? { marginBottom: keyboardHeight }
        : null,
    ],
    [inputOffset, keyboardHeight]
  );
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
    setActiveChatId(chatId);
    return () => {
      setActiveChatId(null);
    };
  }, [chatId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subscriptions: EmitterSubscription[] = [
      Keyboard.addListener(showEvent, (event) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }),
      Keyboard.addListener(hideEvent, () => {
        setKeyboardHeight(0);
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

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

    loadHeaderAvatar().catch((error) => {
      console.error('Error cargando avatar del chat:', error);
    });
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

    loadMatchDetails().catch((error) => {
      console.error('Error cargando detalles del match:', error);
    });
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

    loadAssignments().catch((error) => {
      console.error('Error cargando asignaciones:', error);
    });
    return () => {
      isMounted = false;
    };
  }, [matchId]);

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

    loadOwnerRooms().catch((error) => {
      console.error('Error cargando habitaciones del owner:', error);
    });
    return () => {
      isMounted = false;
    };
  }, [ownerId, isOwner, canSeeAssignees]);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const onListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const threshold = 72;
    const isNearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;
    isAtBottomRef.current = isNearBottom;
    if (isNearBottom) {
      setPendingNewMessages(0);
    }
  }, []);

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
  const roomManagementStatus = useMemo(
    () =>
      getRoomManagementStatus({
        matchStatus,
        matchAssignmentStatus: matchAssignment?.status ?? null,
        acceptedCount: acceptedAssignments.length,
      }),
    [acceptedAssignments.length, matchAssignment?.status, matchStatus]
  );
  const roommatesBadgeCount = canSeeAssignees
    ? acceptedAssignments.length
    : privateRooms.length;

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
            let added = false;
            setMessages((prev) => {
              if (prev.some((message) => message.id === next.id)) return prev;
              added = true;
              return [...prev, next];
            });
            if (added) {
              if (isAtBottomRef.current || next.isMine) {
                setPendingNewMessages(0);
                scrollToBottom(true);
              } else {
                setPendingNewMessages((prev) => prev + 1);
              }
            }
            if (!next.isMine) {
              chatService.markMessagesAsRead(chatId).catch((error) => {
                console.error('Error marcando mensajes como leidos:', error);
              });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    subscribeToMessages().catch((error) => {
      console.error('Error suscribiendo mensajes realtime:', error);
    });

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, currentUserId, scrollToBottom]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(chatId);
        setMessages(data);
        await chatService.markMessagesAsRead(chatId);
        scrollToBottom(false);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      }
    };

    loadMessages().catch((error) => {
      console.error('Error cargando mensajes:', error);
    });
  }, [chatId, scrollToBottom]);

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => toTimeValue(a.createdAtIso) - toTimeValue(b.createdAtIso)
    );
  }, [messages]);

  const chatRows = useMemo<ChatRow[]>(() => {
    const rows: ChatRow[] = [];
    let lastDayKey = '';
    for (const message of orderedMessages) {
      const dayKey = getDayKey(message.createdAtIso);
      if (dayKey !== lastDayKey) {
        rows.push({
          id: `day-${dayKey}`,
          type: 'day',
          label: formatDayLabel(message.createdAtIso),
        });
        lastDayKey = dayKey;
      }
      rows.push({
        id: message.id,
        type: 'message',
        message,
      });
    }
    return rows;
  }, [orderedMessages]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue('');
    try {
      const next = await chatService.sendMessage(chatId, trimmed);
      setMessages((prev) => [...prev, next]);
      setPendingNewMessages(0);
      scrollToBottom(true);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatRow }) => {
    if (item.type === 'day') {
      return (
        <View style={styles.daySeparator}>
          <Text style={styles.daySeparatorText}>{item.label}</Text>
        </View>
      );
    }

    const message = item.message;
    const isMine = message.isMine;
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
          <Text style={styles.bubbleText}>
            {message.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{message.createdAt}</Text>
            {isMine && message.status && (
              <Text style={styles.bubbleStatus}>{statusLabel(message.status)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <GlassBackground />
      <View style={styles.header}>
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
                {`Estado actual: ${roomManagementStatus}`}
              </Text>
            </View>
            {roomManagementStatus && (
              <View style={styles.assignmentStatusPill}>
                <Text style={styles.assignmentStatusText}>
                  {roomManagementStatus}
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
              {roommatesBadgeCount}
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
        ref={listRef}
        data={chatRows}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesListContainer}
        contentContainerStyle={messagesContentStyle}
        showsVerticalScrollIndicator={false}
        onScroll={onListScroll}
        onContentSizeChange={() => {
          if (isAtBottomRef.current) {
            scrollToBottom(false);
          }
        }}
        scrollEventThrottle={16}
      />

      {pendingNewMessages > 0 ? (
        <TouchableOpacity
          style={styles.newMessagesButton}
          onPress={() => {
            setPendingNewMessages(0);
            scrollToBottom(true);
          }}
        >
          <Text style={styles.newMessagesText}>
            {pendingNewMessages === 1
              ? '1 mensaje nuevo'
              : `${pendingNewMessages} mensajes nuevos`}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.inputContainer}>
        <View style={inputRowStyle}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

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
    </KeyboardAvoidingView>
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

const getRoomManagementStatus = (params: {
  matchStatus: MatchStatus | null;
  matchAssignmentStatus: string | null;
  acceptedCount: number;
}) => {
  if (params.matchAssignmentStatus === 'accepted' || params.matchStatus === 'room_assigned') {
    return 'Habitacion asignada';
  }
  if (params.matchAssignmentStatus === 'offered' || params.matchStatus === 'room_offer') {
    return 'Propuesta enviada';
  }
  if (params.matchAssignmentStatus === 'rejected' || params.matchStatus === 'room_declined') {
    return 'Propuesta rechazada';
  }
  if (params.acceptedCount > 0) {
    return 'Habitacion asignada';
  }
  if (params.matchStatus) {
    return matchStatusLabel(params.matchStatus);
  }
  return 'Pendiente';
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
    createdAtIso: payload.created_at,
    isMine,
    status: isMine ? (payload.read_at ? 'read' : 'sent') : undefined,
    readAt: payload.read_at ?? null,
  };
};

const toTimeValue = (iso?: string | null) => {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
};

const getDayKey = (iso?: string | null) => {
  if (!iso) return 'unknown-day';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown-day';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatDayLabel = (iso?: string | null) => {
  if (!iso) return 'Sin fecha';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() - 1);
  if (getDayKey(date.toISOString()) === getDayKey(today.toISOString())) {
    return 'Hoy';
  }
  if (getDayKey(date.toISOString()) === getDayKey(tomorrow.toISOString())) {
    return 'Ayer';
  }
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const formatChatTime = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

