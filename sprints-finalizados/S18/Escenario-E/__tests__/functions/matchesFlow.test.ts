/**
 * Tests para la lógica de like mutuo y flujo de matches.
 *
 * Espeja la lógica del handler POST en:
 *   supabase/functions/matches/index.ts
 *
 * Testea la detección de like mutuo, idempotencia y no-duplicación
 * sin dependencia de Supabase ni de la red.
 */

// ---------------------------------------------------------------------------
// Tipos locales que replican el shape del schema
// ---------------------------------------------------------------------------

type MatchStatus = 'pending' | 'accepted' | 'rejected';

type MatchRecord = {
  id: string;
  status: MatchStatus;
  user_a_id: string;
  user_b_id: string;
};

// ---------------------------------------------------------------------------
// Lógica extraída de matches/index.ts (findExistingMatchBetween + POST handler)
// ---------------------------------------------------------------------------

/** Espejo de findExistingMatchBetween */
function findExistingMatchBetween(
  store: MatchRecord[],
  userAId: string,
  userBId: string
): MatchRecord | null {
  return (
    store.find(
      (m) =>
        (m.user_a_id === userAId && m.user_b_id === userBId) ||
        (m.user_a_id === userBId && m.user_b_id === userAId)
    ) ?? null
  );
}

type PostResult =
  | { action: 'created_pending'; match: MatchRecord }
  | { action: 'mutual_like_accepted'; match: MatchRecord; chatCreated: true }
  | { action: 'idempotent'; match: MatchRecord };

/**
 * Espejo puro del bloque POST del handler de matches.
 * Muta `store` y `chats` igual que el handler real muta la BD.
 */
function handlePostLike(
  store: MatchRecord[],
  chats: string[], // array de match_ids con chat creado
  currentUserId: string,
  targetUserId: string,
  nextId: () => string
): PostResult {
  const existingMatch = findExistingMatchBetween(store, currentUserId, targetUserId);

  if (existingMatch) {
    const isMutualLike =
      existingMatch.status === 'pending' &&
      existingMatch.user_a_id === targetUserId &&
      existingMatch.user_b_id === currentUserId;

    if (isMutualLike) {
      existingMatch.status = 'accepted';
      chats.push(existingMatch.id);
      return { action: 'mutual_like_accepted', match: existingMatch, chatCreated: true };
    }

    return { action: 'idempotent', match: existingMatch };
  }

  const newMatch: MatchRecord = {
    id: nextId(),
    status: 'pending',
    user_a_id: currentUserId,
    user_b_id: targetUserId,
  };
  store.push(newMatch);
  return { action: 'created_pending', match: newMatch };
}

// ---------------------------------------------------------------------------
// Helper de estado limpio
// ---------------------------------------------------------------------------

function makeEnv() {
  const store: MatchRecord[] = [];
  const chats: string[] = [];
  let counter = 1;
  const nextId = () => `match-${counter++}`;
  const like = (from: string, to: string) =>
    handlePostLike(store, chats, from, to, nextId);
  return { store, chats, like };
}

// ---------------------------------------------------------------------------
// Flujo de like mutuo
// ---------------------------------------------------------------------------

describe('Flujo de like mutuo', () => {
  it('A→B crea un registro pending con user_a=A, user_b=B', () => {
    const { store, like } = makeEnv();
    const result = like('A', 'B');

    expect(result.action).toBe('created_pending');
    expect(result.match.status).toBe('pending');
    expect(result.match.user_a_id).toBe('A');
    expect(result.match.user_b_id).toBe('B');
    expect(store).toHaveLength(1);
  });

  it('B→A (cuando A→B pending) actualiza a accepted sin crear nuevo registro', () => {
    const { store, chats, like } = makeEnv();
    like('A', 'B');          // primer like → pending
    const result = like('B', 'A'); // like inverso → mutual

    expect(result.action).toBe('mutual_like_accepted');
    expect(result.match.status).toBe('accepted');
    // Solo debe existir UN registro para el par A/B
    expect(store).toHaveLength(1);
    expect(store[0].status).toBe('accepted');
  });

  it('B→A crea un chat automáticamente al aceptar el match', () => {
    const { chats, like } = makeEnv();
    like('A', 'B');
    const result = like('B', 'A');

    expect(result.action).toBe('mutual_like_accepted');
    expect((result as { chatCreated: boolean }).chatCreated).toBe(true);
    expect(chats).toHaveLength(1);
    expect(chats[0]).toBe(result.match.id);
  });

  it('C→B (sin inverso previo) crea registro pending normal', () => {
    const { store, like } = makeEnv();
    like('A', 'B'); // par A/B existe
    const result = like('C', 'B'); // par C/B es independiente

    expect(result.action).toBe('created_pending');
    expect(result.match.user_a_id).toBe('C');
    expect(result.match.user_b_id).toBe('B');
    expect(store).toHaveLength(2); // A→B y C→B
  });

  it('no existen dos registros para el mismo par tras el like mutuo', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    like('B', 'A');

    const pairRecords = store.filter(
      (m) =>
        (m.user_a_id === 'A' && m.user_b_id === 'B') ||
        (m.user_a_id === 'B' && m.user_b_id === 'A')
    );
    expect(pairRecords).toHaveLength(1);
    expect(pairRecords[0].status).toBe('accepted');
  });
});

// ---------------------------------------------------------------------------
// Idempotencia y no duplicación
// ---------------------------------------------------------------------------

describe('Idempotencia y no duplicación', () => {
  it('segundo like A→B cuando ya está pending → idempotente, sin nuevo registro', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    const result = like('A', 'B'); // duplicado

    expect(result.action).toBe('idempotent');
    expect(store).toHaveLength(1);
  });

  it('like A→B cuando el match ya está accepted → idempotente', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    like('B', 'A'); // acepta → accepted
    const result = like('A', 'B'); // A intenta likar de nuevo

    expect(result.action).toBe('idempotent');
    expect(result.match.status).toBe('accepted');
    expect(store).toHaveLength(1);
  });

  it('no se crean registros espejo (A→B y B→A simultáneos)', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    like('B', 'A'); // transforma en accepted, no crea nuevo

    expect(store).toHaveLength(1);
    const mirror = store.filter(
      (m) =>
        (m.user_a_id === 'A' && m.user_b_id === 'B') ||
        (m.user_a_id === 'B' && m.user_b_id === 'A')
    );
    expect(mirror).toHaveLength(1);
  });

  it('el chat se crea exactamente una vez por like mutuo', () => {
    const { chats, like } = makeEnv();
    like('A', 'B');
    like('B', 'A'); // crea chat
    like('A', 'B'); // idempotente, no crea otro chat

    expect(chats).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Regresión: múltiples pares independientes
// ---------------------------------------------------------------------------

describe('Múltiples pares independientes', () => {
  it('A→B y C→D crean dos registros pending independientes', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    like('C', 'D');

    expect(store).toHaveLength(2);
    expect(store.every((m) => m.status === 'pending')).toBe(true);
  });

  it('like mutuo A↔B no afecta el par C→D', () => {
    const { store, like } = makeEnv();
    like('A', 'B');
    like('C', 'D');
    like('B', 'A'); // acepta A↔B

    expect(store).toHaveLength(2);
    const ab = store.find((m) => m.user_a_id === 'A');
    const cd = store.find((m) => m.user_a_id === 'C');
    expect(ab?.status).toBe('accepted');
    expect(cd?.status).toBe('pending');
  });

  it('findExistingMatchBetween devuelve null cuando no hay match entre el par', () => {
    const store: MatchRecord[] = [];
    const result = findExistingMatchBetween(store, 'X', 'Y');
    expect(result).toBeNull();
  });

  it('findExistingMatchBetween encuentra el match en cualquier dirección', () => {
    const store: MatchRecord[] = [
      { id: 'm1', status: 'pending', user_a_id: 'A', user_b_id: 'B' },
    ];
    expect(findExistingMatchBetween(store, 'A', 'B')).not.toBeNull();
    expect(findExistingMatchBetween(store, 'B', 'A')).not.toBeNull();
    expect(findExistingMatchBetween(store, 'A', 'C')).toBeNull();
  });
});
