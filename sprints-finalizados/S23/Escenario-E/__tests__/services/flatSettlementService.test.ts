/**
 * Tests unitarios e integración para FlatSettlementService.
 *
 * Cubre:
 * - getSettlements: GET con flatId, desempaquetado de data.data
 * - settleDebt: POST con payload correcto, idempotencia de éxito vacío
 * - Manejo de errores (ok: false, mensajes del backend)
 * - Cabecera de autenticación incluida en todas las llamadas
 */

import type { FlatSettlement } from '../../src/types/flatExpense';

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

const makeSettlement = (
  overrides: Partial<FlatSettlement> = {}
): FlatSettlement => ({
  id: 's1',
  flat_id: 'flat-1',
  from_user: 'user-a',
  to_user: 'user-b',
  amount: 25,
  settled_at: null,
  from_user_name: 'Ana',
  to_user_name: 'Bob',
  ...overrides,
});

describe('flatSettlementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue('token-abc');
  });

  // -------------------------------------------------------------------------
  // getSettlements
  // -------------------------------------------------------------------------

  describe('getSettlements', () => {
    it('realiza GET a /flat-settlements con flat_id como query param', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.getSettlements('flat-42');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/flat-settlements');
      expect(url).toContain('flat_id=flat-42');
    });

    it('utiliza el método GET', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.getSettlements('flat-1');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(init.method).toBe('GET');
    });

    it('incluye cabecera Authorization con el token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.getSettlements('flat-1');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer token-abc');
    });

    it('desempaqueta data.data correctamente', async () => {
      const settlements = [
        makeSettlement({ id: 's1', amount: 30 }),
        makeSettlement({ id: 's2', amount: 15, settled_at: '2026-01-10T00:00:00Z' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: settlements }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      const result = await flatSettlementService.getSettlements('flat-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('s1');
      expect(result[1].settled_at).toBe('2026-01-10T00:00:00Z');
    });

    it('devuelve array vacío si no hay liquidaciones', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      const result = await flatSettlementService.getSettlements('flat-vacío');

      expect(result).toEqual([]);
    });

    it('lanza error con el mensaje del backend cuando ok: false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'No tienes acceso a este piso' }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await expect(
        flatSettlementService.getSettlements('flat-ajeno')
      ).rejects.toThrow('No tienes acceso a este piso');
    });

    it('usa mensaje por defecto si el backend no incluye campo error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await expect(
        flatSettlementService.getSettlements('flat-1')
      ).rejects.toThrow('Error al obtener las liquidaciones');
    });

    it('no incluye Authorization si no hay token almacenado', async () => {
      mockStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.getSettlements('flat-1');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(init.headers.Authorization).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // settleDebt
  // -------------------------------------------------------------------------

  describe('settleDebt', () => {
    it('realiza POST a /flat-settlements', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.settleDebt('flat-1', 'user-a', 'user-b', 25);

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/flat-settlements');
      expect(init.method).toBe('POST');
    });

    it('envía el payload correcto: flat_id, from_user, to_user, amount', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.settleDebt('flat-99', 'ana', 'bob', 42.5);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(init.body as string);

      expect(body.flat_id).toBe('flat-99');
      expect(body.from_user).toBe('ana');
      expect(body.to_user).toBe('bob');
      expect(body.amount).toBe(42.5);
    });

    it('incluye cabecera Authorization', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.settleDebt('flat-1', 'u1', 'u2', 10);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer token-abc');
    });

    it('resuelve sin valor cuando ok: true (void)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      const result = await flatSettlementService.settleDebt('flat-1', 'u1', 'u2', 10);

      expect(result).toBeUndefined();
    });

    it('lanza error con el mensaje del backend cuando ok: false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Deuda ya saldada' }),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await expect(
        flatSettlementService.settleDebt('flat-1', 'u1', 'u2', 10)
      ).rejects.toThrow('Deuda ya saldada');
    });

    it('usa mensaje por defecto si el backend no incluye campo error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await expect(
        flatSettlementService.settleDebt('flat-1', 'u1', 'u2', 10)
      ).rejects.toThrow('Error al saldar la deuda');
    });

    it('serializa importes decimales correctamente', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { flatSettlementService } = require('../../src/services/flatSettlementService');
      await flatSettlementService.settleDebt('flat-1', 'u1', 'u2', 12.75);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.amount).toBe(12.75);
    });
  });
});
