import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { chatService } from '../services/chatService';
import { profilePhotoService } from '../services/profilePhotoService';
import type { Chat, Match } from '../types/chat';
import styles from '../styles/screens/MatchesScreen.styles';

export const MatchesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchPhotoByProfile, setMatchPhotoByProfile] = useState<
    Record<string, string>
  >({});

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const [nextMatches, nextChats] = await Promise.all([
        chatService.getMatches(),
        chatService.getChats(),
      ]);
      setMatches(nextMatches);
      setChats(nextChats);
    } catch (error) {
      console.error('Error cargando matches/chats:', error);
      setMatches([]);
      setChats([]);
      setErrorMessage('No se pudo cargar la informacion.');
    }
  }, []);

  useEffect(() => {
    loadData().catch((error) => {
      console.error('Error cargando matches/chats:', error);
    });
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData().catch((error) => {
        console.error('Error cargando matches/chats:', error);
      });
    }, [loadData])
  );

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

    loadMatchPhotos().catch((error) => {
      console.error('Error cargando fotos de matches:', error);
    });
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
        onPress={() => {
          handleOpenMatch(item).catch((error) => {
            console.error('Error abriendo chat del match:', error);
          });
        }}
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
      onPress={() =>
        navigation.navigate('Chat', {
          chatId: item.id,
          name: item.name,
          avatarUrl: item.avatarUrl,
          profile: item.profile,
        })
      }
    >
      <Image
        source={{
          uri:
            matchPhotoByProfile[item.profileId ?? ''] ||
            item.avatarUrl,
        }}
        style={styles.chatAvatar}
      />
      <View style={styles.chatBody}>
        <View style={styles.chatHeaderRow}>
          <Text style={[styles.chatName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.chatTime, { color: theme.colors.textSecondary }]}
          >
            {item.lastMessageAt}
          </Text>
        </View>
        <View style={styles.chatPreviewRow}>
          <Text
            style={[styles.chatPreview, { color: theme.colors.textSecondary }]}
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
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

