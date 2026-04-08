import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { chatService } from '../services/chatService';
import { profilePhotoService } from '../services/profilePhotoService';
import { supabaseClient } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { activeChatId } from '../utils/activeChatRef';
import type { Chat, Match } from '../types/chat';
import { styles } from './MatchesScreen.styles';

const formatTime = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export const MatchesScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? null;
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchPhotoByProfile, setMatchPhotoByProfile] = useState<
    Record<string, string>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const matchesChannelRef = useRef<RealtimeChannel | null>(null);
  const chatIdsRef = useRef<Set<string>>(new Set());

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [nextMatches, nextChats] = await Promise.all([
        chatService.getMatches(),
        chatService.getChats(),
      ]);
      setMatches(nextMatches);
      // Ordenar por el más reciente primero (el servicio ya los devuelve ordenados,
      // pero los mantenemos en el orden recibido como referencia inicial)
      setChats(nextChats);
      chatIdsRef.current = new Set(nextChats.map((c) => c.id));
    } catch (error) {
      console.error('Error cargando matches/chats:', error);
      setMatches([]);
      setChats([]);
      setErrorMessage('No se pudo cargar la informacion.');
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Supabase Realtime: escucha mensajes nuevos en cualquier chat del usuario
  useEffect(() => {
    const setupRealtime = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
      }

      const channel = supabaseClient
        .channel('matches-screen-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const msg = payload.new as {
              id: string;
              chat_id: string;
              sender_id: string;
              body: string;
              created_at: string;
            };

            if (!chatIdsRef.current.has(msg.chat_id)) return;

            const timeStr = formatTime(msg.created_at);
            const isFromMe = msg.sender_id === currentUserId;
            const isChatOpen = msg.chat_id === activeChatId;

            setChats((prev) => {
              const idx = prev.findIndex((c) => c.id === msg.chat_id);
              if (idx === -1) return prev;

              const chat = prev[idx];
              const updated: Chat = {
                ...chat,
                lastMessage: msg.body,
                lastMessageAt: timeStr,
                unreadCount:
                  isFromMe || isChatOpen
                    ? chat.unreadCount
                    : chat.unreadCount + 1,
              };

              // Mover el chat actualizado al principio de la lista
              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    void setupRealtime();

    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Supabase Realtime: detectar nuevos matches sin recargar manualmente
  useEffect(() => {
    const setupMatchesRealtime = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (matchesChannelRef.current) {
        supabaseClient.removeChannel(matchesChannelRef.current);
      }

      const channel = supabaseClient
        .channel('matches-screen-matches')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'matches' },
          (payload) => {
            const row = payload.new as {
              user_a_id?: string;
              user_b_id?: string;
              status?: string;
            };
            const isMyMatch =
              row.user_a_id === currentUserId ||
              row.user_b_id === currentUserId;
            if (!isMyMatch) return;
            void loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'matches' },
          (payload) => {
            const row = payload.new as {
              user_a_id?: string;
              user_b_id?: string;
              status?: string;
            };
            const isMyMatch =
              row.user_a_id === currentUserId ||
              row.user_b_id === currentUserId;
            if (!isMyMatch) return;
            void loadData();
          }
        )
        .subscribe();

      matchesChannelRef.current = channel;
    };

    void setupMatchesRealtime();

    return () => {
      if (matchesChannelRef.current) {
        supabaseClient.removeChannel(matchesChannelRef.current);
        matchesChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const chatMatchIds = useMemo(
    () => new Set(chats.map((chat) => chat.matchId)),
    [chats]
  );

  const unmatched = useMemo(
    () => matches.filter((match) => !chatMatchIds.has(match.id)),
    [matches, chatMatchIds]
  );

  useEffect(() => {
    const loadMatchPhotos = async () => {
      const missing = unmatched.filter(
        (match) => !matchPhotoByProfile[match.profileId]
      );
      if (missing.length === 0) return;

      const updates: Record<string, string> = {};
      await Promise.all(
        missing.map(async (match) => {
          try {
            const photos = await profilePhotoService.getPhotosForProfile(
              match.profileId
            );
            const primary = photos.find((photo) => photo.is_primary) ?? photos[0];
            updates[match.profileId] = primary?.signedUrl || match.avatarUrl;
          } catch (error) {
            console.error('Error cargando foto del match:', error);
            updates[match.profileId] = match.avatarUrl;
          }
        })
      );

      if (Object.keys(updates).length > 0) {
        setMatchPhotoByProfile((prev) => ({ ...prev, ...updates }));
      }
    };

    void loadMatchPhotos();
  }, [unmatched, matchPhotoByProfile]);

  const emptyMessage = useMemo(() => {
    if (errorMessage) return errorMessage;
    return matches.length === 0 && chats.length === 0
      ? 'Aun no tienes matches'
      : 'No hay mensajes todavia';
  }, [errorMessage, matches.length, chats.length]);

  const handleOpenMatch = async (match: Match) => {
    try {
      const chat = await chatService.getOrCreateChat(match.id);
      navigation.navigate('Chat', {
        chatId: chat.id,
        name: chat.name,
        avatarUrl: chat.avatarUrl,
        profile: chat.profile,
      });
    } catch (error) {
      console.error('Error abriendo chat del match:', error);
    }
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const photoUrl = matchPhotoByProfile[item.profileId] || item.avatarUrl;
    return (
      <TouchableOpacity
        style={styles.matchItem}
        onPress={() => void handleOpenMatch(item)}
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        </View>
        <Text style={[styles.matchName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => {
        // Marcar como leído visualmente al abrir
        setChats((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, unreadCount: 0 } : c))
        );
        navigation.navigate('Chat', {
          chatId: item.id,
          name: item.name,
          avatarUrl: item.avatarUrl,
          profile: item.profile,
        });
      }}
    >
      <View style={styles.chatAvatarWrap}>
        <Image
          source={{
            uri:
              matchPhotoByProfile[item.profileId ?? ''] ||
              item.avatarUrl,
          }}
          style={styles.chatAvatar}
        />
        {item.unreadCount > 0 && (
          <View style={styles.onlineDot} />
        )}
      </View>
      <View style={styles.chatBody}>
        <View style={styles.chatHeaderRow}>
          <Text
            style={[
              styles.chatName,
              { color: theme.colors.text },
              item.unreadCount > 0 && styles.chatNameUnread,
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.chatTime,
              { color: theme.colors.textSecondary },
              item.unreadCount > 0 && styles.chatTimeUnread,
            ]}
          >
            {item.lastMessageAt}
          </Text>
        </View>
        <View style={styles.chatPreviewRow}>
          <Text
            style={[
              styles.chatPreview,
              { color: theme.colors.textSecondary },
              item.unreadCount > 0 && styles.chatPreviewUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Matches
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Conversaciones activas y nuevos matches
        </Text>
      </View>

      {matches.length === 0 && chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            unmatched.length > 0 ? (
              <View style={styles.matchesSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Nuevos matches
                </Text>
                <FlatList
                  data={unmatched}
                  keyExtractor={(item) => item.id}
                  renderItem={renderMatch}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.matchesRow}
                />
              </View>
            ) : (
              <View style={styles.matchesSectionEmpty}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Sin nuevos matches
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            chats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  {emptyMessage}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};
