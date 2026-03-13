import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import type { Match } from "../_shared/types.ts";

/**
 * Simulador de la base de datos en memoria para la lógica de Matches (Flujo Mutuo).
 * Esta implementación documenta y valida el flujo de la Parte 5 de los tests:
 * - A->B crea pending
 * - B->A actualiza a accepted (crea chat)
 * - Idempotencia
 * - No duplicados
 */

class MockDatabase {
  matches: Match[] = [];
  chats: { id: string; match_id: string }[] = [];

  // Equivalent to checkExistingMatch
  checkExistingMatch(userAId: string, userBId: string): Match | null {
    return this.matches.find(
      (m) =>
        (m.user_a_id === userAId && m.user_b_id === userBId) ||
        (m.user_a_id === userBId && m.user_b_id === userAId)
    ) || null;
  }

  // Simulate POST handler logic
  async postMatch(currentUserId: string, targetUserId: string) {
    const existing = this.checkExistingMatch(currentUserId, targetUserId);

    if (existing) {
      if (existing.status === "accepted") {
        return { status: 200, data: existing }; // Idempotence
      }

      // If pending and initiated by the other user, we accept it
      if (existing.status === "pending" && existing.user_b_id === currentUserId) {
        existing.status = "accepted";
        
        // Auto-create chat logic (Part 1 / Part 4 Regression)
        if (!this.chats.find(c => c.match_id === existing.id)) {
          this.chats.push({ id: `chat_${existing.id}`, match_id: existing.id });
        }

        return { status: 200, data: existing };
      }

      // If already pending and initiated by current user -> 409
      return { status: 409, error: "Match already exists" };
    }

    // Not exists => create pending
    const newMatch: Match = {
      id: `match_${this.matches.length + 1}`,
      user_a_id: currentUserId,
      user_b_id: targetUserId,
      status: "pending",
      matched_at: new Date().toISOString()
    };
    this.matches.push(newMatch);

    return { status: 201, data: newMatch };
  }
}

Deno.test("Flujo de like mutuo: A->B crea pending, B->A actualiza a accepted y crea chat", async () => {
  const db = new MockDatabase();

  // A -> B
  const res1 = await db.postMatch("user_A", "user_B");
  assertEquals(res1.status, 201);
  assertEquals(res1.data?.status, "pending");

  // Verificar un solo registro
  assertEquals(db.matches.length, 1);

  // B -> A
  const res2 = await db.postMatch("user_B", "user_A");
  assertEquals(res2.status, 200);
  assertEquals(res2.data?.status, "accepted");

  // No existen registros espejo
  assertEquals(db.matches.length, 1);
  
  // Al aceptarse se crea exactamente 1 chat (Regresión)
  assertEquals(db.chats.length, 1);
  assertEquals(db.chats[0].match_id, res2.data?.id);
});

Deno.test("Idempotencia y no duplicación: Segundo like cuando ya está accepted", async () => {
  const db = new MockDatabase();

  // A -> B
  await db.postMatch("user_A", "user_B");
  // B -> A (Accepted)
  await db.postMatch("user_B", "user_A");

  // Ahora A o B intentan dar like de nuevo (A->B)
  const res3 = await db.postMatch("user_A", "user_B");
  
  // Devuelve 200 y status accepted sin error, sin duplicar
  assertEquals(res3.status, 200);
  assertEquals(res3.data?.status, "accepted");
  assertEquals(db.matches.length, 1);
  assertEquals(db.chats.length, 1); // Chat no se duplica
});

Deno.test("C->B (sin inverso previo): crea registro pending normal", async () => {
  const db = new MockDatabase();

  // A -> B
  await db.postMatch("user_A", "user_B");

  // C -> B
  const resC = await db.postMatch("user_C", "user_B");
  assertEquals(resC.status, 201);
  assertEquals(resC.data?.status, "pending");
  assertEquals(resC.data?.user_a_id, "user_C");

  assertEquals(db.matches.length, 2);
});
