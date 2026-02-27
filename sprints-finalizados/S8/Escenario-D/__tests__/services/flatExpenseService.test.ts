import type { FlatExpenseCreateRequest } from '../../src/types/flatExpense';

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

  it('getFlatExpenses supports direct payload shape without nested data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: []
      }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    const expenses = await flatExpenseService.getFlatExpenses('flat-1');
    expect(expenses).toEqual([]);
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
    const input: FlatExpenseCreateRequest = {
      flat_id: 'flat-1',
      description: 'Luz',
      amount: 50,
      paid_by: 'u1',
      splits: [{ user_id: 'u1', amount: 25 }, { user_id: 'u2', amount: 25 }],
    };
    const expense = await flatExpenseService.createExpense(input);

    expect(expense.id).toBe('e1');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"amount":50');
  });

  it('surfaces backend details from failed responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'invalid split sum' }),
    });

    const { flatExpenseService } = require('../../src/services/flatExpenseService');
    await expect(flatExpenseService.createExpense({} as any)).rejects.toThrow(
      'invalid split sum'
    );
  });
});
