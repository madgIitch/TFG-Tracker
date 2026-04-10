/**
 * Tests de integración — PremiumContext con Supabase mockeado
 *
 * Verifica que el contexto:
 *   1. Lee el userId directamente desde AuthContext (sin llamar a getUser)
 *   2. Consulta la tabla `users` con ese id y lee `is_premium`
 *   3. Expone los valores correctos de isPremium, loading y canUseFeature
 *   4. Gestiona errores y ausencia de sesión de forma segura
 *
 * Estrategia de mock:
 *   - AuthContext se recrea como un createContext real para poder envolver
 *     PremiumProvider con <AuthContext.Provider value={...}> en cada test
 *   - authService se mockea para controlar supabaseClient.from()
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// ---------------------------------------------------------------------------
// AuthContext: se reemplaza por un createContext real exportando solo lo
// que PremiumContext necesita (el objeto Context, no el Provider completo)
// ---------------------------------------------------------------------------

jest.mock('../../src/context/AuthContext', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createContext } = require('react');
  return { AuthContext: createContext(null) };
});

// ---------------------------------------------------------------------------
// Mocks de authService — factory crea las funciones y las expone en `m`
// ---------------------------------------------------------------------------

const m: {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
} = {} as any;

jest.mock('../../src/services/authService', () => {
  const single = jest.fn();
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));

  Object.assign(m, { from, select, eq, single });

  return { supabaseClient: { from } };
});

// ---------------------------------------------------------------------------
// Imports que dependen de los mocks
// ---------------------------------------------------------------------------

import { AuthContext } from '../../src/context/AuthContext';
import { PremiumProvider, usePremium, Feature } from '../../src/context/PremiumContext';

// ---------------------------------------------------------------------------
// Helper: drena la cadena async de fetchPremiumStatus
// ---------------------------------------------------------------------------

const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------
// Componente consumidor
// ---------------------------------------------------------------------------

type Captured = {
  isPremium: boolean;
  loading: boolean;
  canUse: Record<Feature, boolean>;
};

let captured: Captured = {
  isPremium: false,
  loading: true,
  canUse: { unlimited_swipes: false, gender_filter: false, age_filter: false },
};

const TestConsumer: React.FC = () => {
  const { isPremium, loading, canUseFeature } = usePremium();
  captured = {
    isPremium,
    loading,
    canUse: {
      unlimited_swipes: canUseFeature('unlimited_swipes'),
      gender_filter: canUseFeature('gender_filter'),
      age_filter: canUseFeature('age_filter'),
    },
  };
  return null;
};

// ---------------------------------------------------------------------------
// Helper de renderizado — envuelve con AuthContext.Provider para inyectar userId
// ---------------------------------------------------------------------------

const renderWithProvider = async (
  userId: string | null
): Promise<ReactTestRenderer.ReactTestRenderer> => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const authValue = userId ? { user: { id: userId } } : { user: null };

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthContext.Provider value={authValue as any}>
        <PremiumProvider>
          <TestConsumer />
        </PremiumProvider>
      </AuthContext.Provider>
    );
  });
  await ReactTestRenderer.act(async () => {
    await flushPromises();
  });
  return renderer;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PremiumContext — integración con Supabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    m.single.mockReset();
    m.eq.mockReset();
    m.select.mockReset();
    m.from.mockReset();
    m.eq.mockReturnValue({ single: m.single });
    m.select.mockReturnValue({ eq: m.eq });
    m.from.mockReturnValue({ select: m.select });

    captured = {
      isPremium: false,
      loading: true,
      canUse: { unlimited_swipes: false, gender_filter: false, age_filter: false },
    };
  });

  // ---- Usuario premium ----

  it('lee is_premium=true y expone isPremium=true con todas las features desbloqueadas', async () => {
    m.single.mockResolvedValue({ data: { is_premium: true } });

    await renderWithProvider('user-premium-id');

    expect(captured.isPremium).toBe(true);
    expect(captured.loading).toBe(false);
    expect(captured.canUse.unlimited_swipes).toBe(true);
    expect(captured.canUse.gender_filter).toBe(true);
    expect(captured.canUse.age_filter).toBe(true);
  });

  // ---- Usuario free ----

  it('lee is_premium=false y deniega todas las features premium', async () => {
    m.single.mockResolvedValue({ data: { is_premium: false } });

    await renderWithProvider('user-free-id');

    expect(captured.isPremium).toBe(false);
    expect(captured.loading).toBe(false);
    expect(captured.canUse.unlimited_swipes).toBe(false);
    expect(captured.canUse.gender_filter).toBe(false);
    expect(captured.canUse.age_filter).toBe(false);
  });

  // ---- Consulta correcta a Supabase ----

  it('consulta la tabla users con el id del usuario autenticado', async () => {
    m.single.mockResolvedValue({ data: { is_premium: true } });

    await renderWithProvider('69bbac7d-b06c-4b40-9ee6-17b2013782fd');

    expect(m.from).toHaveBeenCalledWith('users');
    expect(m.select).toHaveBeenCalledWith('is_premium');
    expect(m.eq).toHaveBeenCalledWith('id', '69bbac7d-b06c-4b40-9ee6-17b2013782fd');
    expect(m.single).toHaveBeenCalledTimes(1);
  });

  // ---- Sin sesión ----

  it('sin userId (user=null) → isPremium=false, loading=false sin consultar BD', async () => {
    await renderWithProvider(null);

    expect(captured.isPremium).toBe(false);
    expect(captured.loading).toBe(false);
    expect(m.from).not.toHaveBeenCalled();
  });

  // ---- Error en la consulta ----

  it('error en la consulta a users → isPremium=false, loading=false', async () => {
    m.single.mockRejectedValue(new Error('db error'));

    await renderWithProvider('some-id');

    expect(captured.isPremium).toBe(false);
    expect(captured.loading).toBe(false);
  });

  // ---- Valor nulo de is_premium ----

  it('is_premium=null en BD → isPremium=false gracias al fallback ?? false', async () => {
    m.single.mockResolvedValue({ data: { is_premium: null } });

    await renderWithProvider('some-id');

    expect(captured.isPremium).toBe(false);
  });

  // ---- Refetch ----

  it('refetch() vuelve a consultar Supabase y actualiza el estado', async () => {
    m.single
      .mockResolvedValueOnce({ data: { is_premium: false } })
      .mockResolvedValueOnce({ data: { is_premium: true } });

    let refetchFn: (() => void) | undefined;

    const TestConsumerWithRefetch: React.FC = () => {
      const { isPremium, loading, canUseFeature, refetch } = usePremium();
      refetchFn = refetch;
      captured = {
        isPremium,
        loading,
        canUse: {
          unlimited_swipes: canUseFeature('unlimited_swipes'),
          gender_filter: canUseFeature('gender_filter'),
          age_filter: canUseFeature('age_filter'),
        },
      };
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AuthContext.Provider value={{ user: { id: 'some-id' } } as any}>
          <PremiumProvider>
            <TestConsumerWithRefetch />
          </PremiumProvider>
        </AuthContext.Provider>
      );
    });
    await ReactTestRenderer.act(async () => { await flushPromises(); });

    expect(captured.isPremium).toBe(false);

    await ReactTestRenderer.act(async () => {
      refetchFn?.();
      await flushPromises();
    });

    expect(captured.isPremium).toBe(true);
    expect(m.single).toHaveBeenCalledTimes(2);
  });
});
