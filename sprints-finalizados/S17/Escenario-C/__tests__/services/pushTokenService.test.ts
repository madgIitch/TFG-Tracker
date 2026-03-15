const mockRegisterDeviceForRemoteMessages = jest.fn();
const mockGetToken = jest.fn();
const mockDeleteToken = jest.fn();

jest.mock('@react-native-firebase/messaging', () => {
  const messagingFn = () => ({
    registerDeviceForRemoteMessages: mockRegisterDeviceForRemoteMessages,
    getToken: mockGetToken,
    deleteToken: mockDeleteToken,
    requestPermission: jest.fn(),
  });

  (messagingFn as any).AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };

  return messagingFn;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('pushTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('registerToken posts token and platform when not previously registered', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(null).mockResolvedValueOnce('auth-token');
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true });
    mockGetToken.mockResolvedValue('fcm-token-1');

    const { pushTokenService } = require('../../src/services/pushTokenService');
    const token = await pushTokenService.registerToken();

    expect(token).toBe('fcm-token-1');
    expect(mockRegisterDeviceForRemoteMessages).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"token":"fcm-token-1"');
  });

  it('unregisterToken deletes backend token and local key', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce('auth-token').mockResolvedValueOnce('fcm-token-1');
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true });
    mockGetToken.mockResolvedValue('fcm-token-1');

    const { pushTokenService } = require('../../src/services/pushTokenService');
    await pushTokenService.unregisterToken();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('DELETE');
    expect(init.body).toContain('"token":"fcm-token-1"');
    expect(mockDeleteToken).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});

export {};
