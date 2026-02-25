import type { CreateFlatExpenseRequest } from '../../src/types/flatExpense';

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('flatExpenseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue('token-1');
  });

  it('getMyExpenseFlats unwraps payload.data.flats', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          flats: [
            { id: 'f1', owner_id: 'o1', address: 'A', city: 'C', district: null },
          ],
        },
      }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    const flats = await flatExpenseService.getMyExpenseFlats();
    expect(flats).toHaveLength(1);
    expect(flats[0].id).toBe('f1');
  });

  it('getFlatExpenses supports direct payload shape without nested data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        expenses: [],
        members: [{ id: 'u1', display_name: 'Ana' }],
      }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    const payload = await flatExpenseService.getFlatExpenses('flat-1');
    expect(payload.expenses).toEqual([]);
    expect(payload.members).toHaveLength(1);
  });

  it('createFlatExpense posts input and returns unwrapped entity', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'e1',
          flat_id: 'flat-1',
          description: 'Luz',
          amount: 50,
          paid_by: 'u1',
          split_between: ['u1', 'u2'],
          created_at: '2026-01-01T00:00:00.000Z',
          splits: [],
        },
      }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    const input: CreateFlatExpenseRequest = {
      flat_id: 'flat-1',
      description: 'Luz',
      amount: 50,
      paid_by: 'u1',
      split_between: ['u1', 'u2'],
      split_type: 'equal',
    };
    const expense = await flatExpenseService.createFlatExpense(input);

    expect(expense.id).toBe('e1');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"amount":50');
  });

  it('surfaces backend details from failed responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ details: 'invalid split sum' }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    await expect(flatExpenseService.getMyExpenseFlats()).rejects.toThrow(
      'invalid split sum'
    );
  });
});
