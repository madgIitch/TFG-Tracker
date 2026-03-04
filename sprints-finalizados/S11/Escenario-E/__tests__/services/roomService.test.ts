const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('roomService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue('token-1');
  });

  it('createRoom sends payload and returns created room', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'r1',
          flat_id: 'f1',
          owner_id: 'u1',
          title: 'Habitacion 1',
          price_per_month: 500,
          created_at: '2026-01-01',
        },
      }),
    });

    const { roomService } = require('../../src/services/roomService');
    const room = await roomService.createRoom({
      flat_id: 'f1',
      title: 'Habitacion 1',
      price_per_month: 500,
    });

    expect(room.id).toBe('r1');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"title":"Habitacion 1"');
  });

  it('createRoom throws backend error string when request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'price_per_month must be > 0' }),
    });

    const { roomService } = require('../../src/services/roomService');
    await expect(
      roomService.createRoom({
        flat_id: 'f1',
        title: 'Habitacion',
        price_per_month: 0,
      })
    ).rejects.toThrow('price_per_month must be > 0');
  });

  it('searchRooms sends filters with page and per_page', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        count: 0,
        page: 2,
        per_page: 10,
        total_pages: 0,
      }),
    });

    const { roomService } = require('../../src/services/roomService');
    const response = await roomService.searchRooms({ city: 'Madrid' }, 2, 10);

    expect(response.page).toBe(2);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"city":"Madrid"');
    expect(init.body).toContain('"page":2');
    expect(init.body).toContain('"per_page":10');
  });
});
