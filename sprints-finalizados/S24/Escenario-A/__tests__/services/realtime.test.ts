import {
  buildRealtimeChannelName,
  cleanupRealtimeSubscription,
  createRealtimeSubscription,
  setRealtimeAuthFromStorage,
} from '../../src/services/realtime';

const mockGetItem = jest.fn();
const mockSetAuth = jest.fn();
const mockRemoveChannel = jest.fn();
const mockChannelOn = jest.fn();
const mockChannelSubscribe = jest.fn();
const mockChannel = {
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
};
const mockChannelFactory = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    realtime: {
      setAuth: (...args: unknown[]) => mockSetAuth(...args),
    },
    channel: (...args: unknown[]) => mockChannelFactory(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

describe('realtime service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue('token-1');
    mockChannelOn.mockImplementation(() => mockChannel);
    mockChannelSubscribe.mockReturnValue(mockChannel);
    mockChannelFactory.mockReturnValue(mockChannel);
  });

  it('buildRealtimeChannelName generates deterministic sanitized names', () => {
    const name = buildRealtimeChannelName(
      'matches/screen',
      'chat list',
      'flat:123',
      'user@abc'
    );

    expect(name).toBe('rt:matches_screen:chat_list:flat:123:user_abc');
  });

  it('setRealtimeAuthFromStorage sets auth token when available', async () => {
    await setRealtimeAuthFromStorage();
    expect(mockGetItem).toHaveBeenCalledWith('authToken');
    expect(mockSetAuth).toHaveBeenCalledWith('token-1');
  });

  it('createRealtimeSubscription registers handlers and subscribes channel', async () => {
    const onEventA = jest.fn();
    const onEventB = jest.fn();

    const channel = await createRealtimeSubscription('rt:test', [
      {
        filter: { event: '*', schema: 'public', table: 'matches' },
        onEvent: onEventA,
      },
      {
        filter: {
          event: 'UPDATE',
          schema: 'public',
          table: 'flat_expenses',
          filter: 'flat_id=eq.abc',
        },
        onEvent: onEventB,
      },
    ]);

    expect(channel).toBe(mockChannel);
    expect(mockChannelFactory).toHaveBeenCalledWith('rt:test');
    expect(mockChannelOn).toHaveBeenCalledTimes(2);
    expect(mockChannelSubscribe).toHaveBeenCalledTimes(1);
  });

  it('cleanupRealtimeSubscription removes existing channel', () => {
    cleanupRealtimeSubscription(mockChannel as any);
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});

