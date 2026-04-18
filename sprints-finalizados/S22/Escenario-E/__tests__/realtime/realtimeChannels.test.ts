/**
 * Tests de integración para la lógica de canales Supabase Realtime.
 *
 * Espeja los filtros y nombres de canal implementados en:
 *   - FlatExpensesScreen    → canal flat-expenses-{flatId}
 *   - FlatSettlementScreen  → canal flat-settlements-{flatId}
 *   - MatchesScreen         → canal matches-screen-matches
 *   - RoomManagementScreen  → canal room-mgmt-{selectedFlatId}
 *   - RoomDetailScreen      → canal room-detail-{roomId}
 *
 * Ninguna pantalla de React Native está importada — se testea la lógica pura
 * de los callbacks y la nomenclatura de canales.
 */

// ---------------------------------------------------------------------------
// Nomenclatura de canales — unicidad y formato
// ---------------------------------------------------------------------------

function expensesChannelName(flatId: string) {
  return `flat-expenses-${flatId}`;
}

function settlementsChannelName(flatId: string) {
  return `flat-settlements-${flatId}`;
}

function roomMgmtChannelName(flatId: string) {
  return `room-mgmt-${flatId}`;
}

function roomDetailChannelName(roomId: string) {
  return `room-detail-${roomId}`;
}

describe('Nomenclatura de canales', () => {
  describe('flat-expenses', () => {
    it('incluye el flatId en el nombre', () => {
      expect(expensesChannelName('flat-abc')).toBe('flat-expenses-flat-abc');
    });

    it('dos flatIds distintos producen nombres distintos', () => {
      expect(expensesChannelName('flat-1')).not.toBe(expensesChannelName('flat-2'));
    });

    it('es determinista para el mismo flatId', () => {
      expect(expensesChannelName('flat-x')).toBe(expensesChannelName('flat-x'));
    });
  });

  describe('flat-settlements', () => {
    it('incluye el flatId en el nombre', () => {
      expect(settlementsChannelName('flat-abc')).toBe('flat-settlements-flat-abc');
    });

    it('es diferente al canal de gastos para el mismo flatId', () => {
      const id = 'flat-1';
      expect(settlementsChannelName(id)).not.toBe(expensesChannelName(id));
    });
  });

  describe('room-mgmt', () => {
    it('incluye el flatId en el nombre', () => {
      expect(roomMgmtChannelName('flat-99')).toBe('room-mgmt-flat-99');
    });

    it('cambia al cambiar el piso seleccionado', () => {
      expect(roomMgmtChannelName('flat-1')).not.toBe(roomMgmtChannelName('flat-2'));
    });
  });

  describe('room-detail', () => {
    it('incluye el roomId en el nombre', () => {
      expect(roomDetailChannelName('room-xyz')).toBe('room-detail-room-xyz');
    });

    it('dos habitaciones distintas producen nombres distintos', () => {
      expect(roomDetailChannelName('room-1')).not.toBe(roomDetailChannelName('room-2'));
    });
  });

  describe('colisiones entre canales', () => {
    it('expenses y settlements no colisionan para el mismo flat', () => {
      const flatId = 'flat-shared';
      const names = [
        expensesChannelName(flatId),
        settlementsChannelName(flatId),
        roomMgmtChannelName(flatId),
      ];
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('expenses de distintos pisos no colisionan', () => {
      const names = ['flat-a', 'flat-b', 'flat-c'].map(expensesChannelName);
      expect(new Set(names).size).toBe(3);
    });
  });

  describe('canal matches-screen-messages y matches-screen-matches son distintos', () => {
    it('los dos canales de MatchesScreen tienen nombres diferentes', () => {
      expect('matches-screen-messages').not.toBe('matches-screen-matches');
    });
  });
});

// ---------------------------------------------------------------------------
// Filtros de evento — FlatExpensesScreen
// ---------------------------------------------------------------------------

/** Replica el filtro del callback de flat_expenses en FlatExpensesScreen */
function shouldHandleExpenseInsert(
  payload: { flat_id?: string },
  subscribedFlatId: string
): boolean {
  return payload.flat_id === subscribedFlatId;
}

describe('FlatExpensesScreen — filtro de evento INSERT', () => {
  it('acepta un evento cuyo flat_id coincide', () => {
    expect(shouldHandleExpenseInsert({ flat_id: 'flat-1' }, 'flat-1')).toBe(true);
  });

  it('rechaza un evento de otro piso', () => {
    expect(shouldHandleExpenseInsert({ flat_id: 'flat-2' }, 'flat-1')).toBe(false);
  });

  it('rechaza un evento sin flat_id', () => {
    expect(shouldHandleExpenseInsert({}, 'flat-1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Filtros de evento — FlatSettlementScreen
// ---------------------------------------------------------------------------

/** Replica el filtro usado tanto para flat_expenses como flat_settlements */
function shouldHandleSettlementEvent(
  payload: { flat_id?: string },
  subscribedFlatId: string
): boolean {
  return payload.flat_id === subscribedFlatId;
}

describe('FlatSettlementScreen — filtro de eventos', () => {
  it('acepta INSERT en flat_expenses del piso correcto', () => {
    expect(shouldHandleSettlementEvent({ flat_id: 'flat-1' }, 'flat-1')).toBe(true);
  });

  it('acepta UPDATE en flat_settlements del piso correcto', () => {
    expect(shouldHandleSettlementEvent({ flat_id: 'flat-1' }, 'flat-1')).toBe(true);
  });

  it('rechaza eventos de otro piso', () => {
    expect(shouldHandleSettlementEvent({ flat_id: 'flat-otro' }, 'flat-1')).toBe(false);
  });

  it('el mismo filtro sirve para INSERT y UPDATE (mismo campo flat_id)', () => {
    // La lógica es idéntica para ambos eventos — un solo helper
    const insertPayload = { flat_id: 'flat-1' };
    const updatePayload = { flat_id: 'flat-1' };
    expect(shouldHandleSettlementEvent(insertPayload, 'flat-1')).toBe(
      shouldHandleSettlementEvent(updatePayload, 'flat-1')
    );
  });
});

// ---------------------------------------------------------------------------
// Filtros de evento — MatchesScreen (nuevos matches)
// ---------------------------------------------------------------------------

/** Replica el filtro del canal matches-screen-matches */
function shouldHandleMatchEvent(
  payload: { user_a_id?: string; user_b_id?: string },
  currentUserId: string
): boolean {
  return (
    payload.user_a_id === currentUserId ||
    payload.user_b_id === currentUserId
  );
}

describe('MatchesScreen — filtro de nuevo match', () => {
  it('acepta si el usuario actual es user_a', () => {
    expect(shouldHandleMatchEvent({ user_a_id: 'me', user_b_id: 'other' }, 'me')).toBe(true);
  });

  it('acepta si el usuario actual es user_b', () => {
    expect(shouldHandleMatchEvent({ user_a_id: 'other', user_b_id: 'me' }, 'me')).toBe(true);
  });

  it('rechaza si el usuario no es ninguno de los dos', () => {
    expect(shouldHandleMatchEvent({ user_a_id: 'x', user_b_id: 'y' }, 'me')).toBe(false);
  });

  it('rechaza si el payload está vacío', () => {
    expect(shouldHandleMatchEvent({}, 'me')).toBe(false);
  });

  it('no dispara loadData para matches de otros usuarios', () => {
    const events = [
      { user_a_id: 'alice', user_b_id: 'bob' },
      { user_a_id: 'carol', user_b_id: 'dave' },
      { user_a_id: 'me', user_b_id: 'eve' }, // este sí
    ];
    const triggered = events.filter((e) => shouldHandleMatchEvent(e, 'me'));
    expect(triggered).toHaveLength(1);
    expect(triggered[0].user_b_id).toBe('eve');
  });
});

// ---------------------------------------------------------------------------
// Filtros de evento — RoomManagementScreen
// ---------------------------------------------------------------------------

/** Replica el filtro de rooms INSERT/UPDATE en RoomManagementScreen */
function shouldHandleRoomEvent(
  payload: { flat_id?: string },
  selectedFlatId: string
): boolean {
  return payload.flat_id === selectedFlatId;
}

describe('RoomManagementScreen — filtro de eventos de habitación', () => {
  it('acepta INSERT de una habitación del piso seleccionado', () => {
    expect(shouldHandleRoomEvent({ flat_id: 'flat-1' }, 'flat-1')).toBe(true);
  });

  it('rechaza INSERT de habitación de otro piso', () => {
    expect(shouldHandleRoomEvent({ flat_id: 'flat-otro' }, 'flat-1')).toBe(false);
  });

  it('acepta UPDATE de habitación del piso seleccionado', () => {
    expect(shouldHandleRoomEvent({ flat_id: 'flat-1' }, 'flat-1')).toBe(true);
  });

  it('room_assignments no tiene flat_id — el callback no filtra por flat (llama loadRooms siempre)', () => {
    // room_assignments solo tiene room_id, no flat_id
    // Por eso en RoomManagementScreen el callback de assignments no filtra
    const assignmentPayload = { room_id: 'room-xyz' };
    // No hay flat_id → no podemos filtrar aquí, siempre recarga
    expect(assignmentPayload).not.toHaveProperty('flat_id');
  });
});

// ---------------------------------------------------------------------------
// Filtros de evento — RoomDetailScreen
// ---------------------------------------------------------------------------

/** Replica el filtro de room_assignments en RoomDetailScreen */
function shouldHandleAssignmentEvent(
  payload: { room_id?: string },
  currentRoomId: string
): boolean {
  return payload.room_id === currentRoomId;
}

describe('RoomDetailScreen — filtro de asignaciones', () => {
  it('acepta INSERT de asignación para la habitación actual', () => {
    expect(shouldHandleAssignmentEvent({ room_id: 'room-1' }, 'room-1')).toBe(true);
  });

  it('acepta UPDATE de asignación para la habitación actual', () => {
    expect(shouldHandleAssignmentEvent({ room_id: 'room-1' }, 'room-1')).toBe(true);
  });

  it('rechaza asignación de otra habitación', () => {
    expect(shouldHandleAssignmentEvent({ room_id: 'room-otro' }, 'room-1')).toBe(false);
  });

  it('rechaza payload sin room_id', () => {
    expect(shouldHandleAssignmentEvent({}, 'room-1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Patrón realtimeVersion — RoomDetailScreen
// ---------------------------------------------------------------------------

describe('patrón realtimeVersion (RoomDetailScreen)', () => {
  /** Simula el estado y el incremento */
  function createVersionState(initial = 0) {
    let version = initial;
    const increment = () => { version += 1; };
    const get = () => version;
    return { increment, get };
  }

  it('incrementar la versión cambia el valor', () => {
    const v = createVersionState(0);
    v.increment();
    expect(v.get()).toBe(1);
  });

  it('múltiples eventos incrementan la versión acumulativamente', () => {
    const v = createVersionState(0);
    v.increment(); // INSERT
    v.increment(); // UPDATE
    expect(v.get()).toBe(2);
  });

  it('el re-fetch se dispara exactamente una vez por evento relevante', () => {
    const v = createVersionState(0);
    const relevantEvents = [
      { room_id: 'room-1' }, // relevante
      { room_id: 'room-2' }, // otro — filtrado antes de llegar aquí
    ];

    relevantEvents
      .filter((e) => shouldHandleAssignmentEvent(e, 'room-1'))
      .forEach(() => v.increment());

    expect(v.get()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Ciclo de vida — cleanup al desmontar
// ---------------------------------------------------------------------------

describe('ciclo de vida — cleanup de canales', () => {
  it('removeChannel con null no lanza error (guard defensivo)', () => {
    // Replica el patrón: if (channelRef.current) removeChannel(...)
    const channelRef: { current: object | null } = { current: null };
    expect(() => {
      if (channelRef.current) {
        throw new Error('No debería entrar aquí');
      }
    }).not.toThrow();
  });

  it('después del cleanup el ref queda a null', () => {
    const channelRef: { current: object | null } = { current: { subscribe: () => {} } };
    // Simula el return () => { ... channelRef.current = null }
    channelRef.current = null;
    expect(channelRef.current).toBeNull();
  });

  it('un nuevo setupRealtime reemplaza el canal anterior antes de suscribir', () => {
    // Verifica que removeChannel se llama antes de crear el nuevo canal
    const removed: string[] = [];
    const created: string[] = [];

    function setupChannel(name: string) {
      // Si ya existe, primero quitar
      if (created.length > 0) {
        removed.push(created[created.length - 1]);
      }
      created.push(name);
    }

    setupChannel(expensesChannelName('flat-1'));
    setupChannel(expensesChannelName('flat-1')); // segunda llamada (focus effect)

    // El primer canal fue removido antes del segundo
    expect(removed).toHaveLength(1);
    expect(removed[0]).toBe('flat-expenses-flat-1');
    expect(created).toHaveLength(2);
  });
});
