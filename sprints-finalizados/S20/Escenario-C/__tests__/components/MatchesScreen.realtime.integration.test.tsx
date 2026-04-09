import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { MatchesScreen } from '../../src/screens/MatchesScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: () => undefined,
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      text: '#111827',
      textSecondary: '#6B7280',
      primary: '#7C3AED',
      background: '#FFFFFF',
    },
  }),
}));

const mockGetMatches = jest.fn();
const mockGetChats = jest.fn();
const mockGetOrCreateChat = jest.fn();

jest.mock('../../src/services/chatService', () => ({
  chatService: {
    getMatches: () => mockGetMatches(),
    getChats: () => mockGetChats(),
    getOrCreateChat: (...args: unknown[]) => mockGetOrCreateChat(...args),
  },
}));

const mockGetPhotosForProfile = jest.fn();

jest.mock('../../src/services/profilePhotoService', () => ({
  profilePhotoService: {
    getPhotosForProfile: (...args: unknown[]) => mockGetPhotosForProfile(...args),
  },
}));

const mockGetSession = jest.fn();
const mockSetAuth = jest.fn();
const mockRemoveChannel = jest.fn();
const mockChannel = jest.fn();
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);

const realtimeCallbacks: Record<string, Array<() => void>> = {};

const channelRef = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: (...args: unknown[]) => mockUnsubscribe(...args),
};

channelRef.on.mockImplementation((event: string, config: { table: string }, callback: () => void) => {
  if (event === 'postgres_changes') {
    if (!realtimeCallbacks[config.table]) {
      realtimeCallbacks[config.table] = [];
    }
    realtimeCallbacks[config.table].push(callback);
  }
  return channelRef;
});

channelRef.subscribe.mockReturnValue(channelRef);

mockChannel.mockReturnValue(channelRef);

jest.mock('../../src/services/authService', () => ({
  supabaseClient: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    realtime: {
      setAuth: (...args: unknown[]) => mockSetAuth(...args),
    },
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

describe('MatchesScreen realtime integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(realtimeCallbacks).forEach((key) => delete realtimeCallbacks[key]);

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-1',
        },
      },
    });

    mockGetMatches.mockResolvedValue([
      {
        id: 'match-1',
        profileId: 'profile-1',
        name: 'Ana',
        avatarUrl: 'https://example.com/a.jpg',
        status: 'accepted',
      },
    ]);

    mockGetChats.mockResolvedValue([]);
    mockGetPhotosForProfile.mockResolvedValue([]);
  });

  it('subscribes with unique channel name and cleans up on unmount', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<MatchesScreen />);
      await Promise.resolve();
    });

    expect(mockChannel).toHaveBeenCalledWith(
      'rt:matches:resource:matches-chats-messages:screen:Matches'
    );

    await ReactTestRenderer.act(async () => {
      tree!.unmount();
      await Promise.resolve();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelRef);
  });

  it('refreshes matches when realtime matches event arrives', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<MatchesScreen />);
      await Promise.resolve();
    });

    const callsBeforeRealtime = mockGetMatches.mock.calls.length;
    expect(callsBeforeRealtime).toBeGreaterThan(0);

    await ReactTestRenderer.act(async () => {
      const matchCallbacks = realtimeCallbacks.matches ?? [];
      expect(matchCallbacks.length).toBeGreaterThan(0);
      matchCallbacks[0]();
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 260));
      await Promise.resolve();
    });

    expect(mockGetMatches.mock.calls.length).toBeGreaterThan(callsBeforeRealtime);

    await ReactTestRenderer.act(async () => {
      tree!.unmount();
      await Promise.resolve();
    });
  });
});
