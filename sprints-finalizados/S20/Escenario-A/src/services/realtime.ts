import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const sanitizeChannelPart = (value: string | null | undefined): string => {
  if (!value) return 'none';
  return value.replace(/[^a-zA-Z0-9:_-]/g, '_');
};

export const buildRealtimeChannelName = (
  screen: string,
  resource: string,
  resourceId?: string | null,
  userId?: string | null
): string => {
  const parts = [
    'rt',
    sanitizeChannelPart(screen),
    sanitizeChannelPart(resource),
    sanitizeChannelPart(resourceId ?? 'all'),
    sanitizeChannelPart(userId ?? 'anon'),
  ];
  return parts.join(':');
};

export const setRealtimeAuthFromStorage = async (): Promise<void> => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    supabase.realtime.setAuth(token);
  }
};

export const createRealtimeSubscription = async (
  channelName: string,
  handlers: Array<{
    filter: {
      event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
      schema: 'public';
      table: string;
      filter?: string;
    };
    onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  }>
): Promise<RealtimeChannel> => {
  await setRealtimeAuthFromStorage();

  const channel = supabase.channel(channelName);
  handlers.forEach(({ filter, onEvent }) => {
    channel.on('postgres_changes', filter as any, onEvent as any);
  });
  channel.subscribe();
  return channel;
};

export const cleanupRealtimeSubscription = (channel: RealtimeChannel | null): void => {
  if (!channel) return;
  supabase.removeChannel(channel);
};
