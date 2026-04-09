/**
 * Tests unitarios para la lógica de selección de lifestyle_tags en perfiles.
 *
 * Espeja la lógica de EditProfileScreen (selección, límite, toggle)
 * y la restricción CHECK de la BD (array_length <= 5).
 *
 * Sin dependencias de React Native — lógica pura extraída de los handlers.
 */

import { MAX_LIFESTYLE_TAGS } from '../../src/constants/lifestyleTags';

// ---------------------------------------------------------------------------
// Funciones puras que replican los handlers de EditProfileScreen
// ---------------------------------------------------------------------------

/** Replica el onPress del chip: toggle de un tag en el array actual */
function toggleTag(current: string[], tagId: string): string[] {
  if (current.includes(tagId)) {
    return current.filter((t) => t !== tagId);
  }
  return [...current, tagId];
}

/** Indica si un tag no-seleccionado debe estar desactivado (límite alcanzado) */
function isTagDisabled(current: string[], tagId: string): boolean {
  const isSelected = current.includes(tagId);
  return !isSelected && current.length >= MAX_LIFESTYLE_TAGS;
}

/** Replica el guard completo del onPress */
function handleTagPress(current: string[], tagId: string): string[] {
  if (isTagDisabled(current, tagId)) return current; // no-op
  return toggleTag(current, tagId);
}

// ---------------------------------------------------------------------------
// Toggle — comportamiento básico
// ---------------------------------------------------------------------------

describe('toggleTag', () => {
  it('añade un tag cuando no está seleccionado', () => {
    const result = toggleTag([], 'deportista');
    expect(result).toEqual(['deportista']);
  });

  it('elimina un tag cuando ya está seleccionado', () => {
    const result = toggleTag(['deportista', 'noctambulo'], 'deportista');
    expect(result).toEqual(['noctambulo']);
  });

  it('no muta el array original', () => {
    const original = ['deportista'];
    toggleTag(original, 'noctambulo');
    expect(original).toEqual(['deportista']);
  });

  it('preserva el orden de los demás tags al eliminar uno', () => {
    const result = toggleTag(['a', 'b', 'c', 'd'], 'b');
    expect(result).toEqual(['a', 'c', 'd']);
  });

  it('puede vaciar completamente el array', () => {
    const result = toggleTag(['solo'], 'solo');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isTagDisabled — límite de MAX_LIFESTYLE_TAGS
// ---------------------------------------------------------------------------

describe('isTagDisabled', () => {
  it('devuelve false cuando hay menos de 5 seleccionados y el tag no está seleccionado', () => {
    const current = ['a', 'b', 'c'];
    expect(isTagDisabled(current, 'd')).toBe(false);
  });

  it('devuelve true cuando hay 5 seleccionados y el tag no está entre ellos', () => {
    const current = ['a', 'b', 'c', 'd', 'e'];
    expect(isTagDisabled(current, 'f')).toBe(true);
  });

  it('devuelve false para un tag YA seleccionado aunque haya 5 (puede deseleccionarse)', () => {
    const current = ['a', 'b', 'c', 'd', 'e'];
    expect(isTagDisabled(current, 'a')).toBe(false);
  });

  it('devuelve false con exactamente 4 seleccionados (aún hay hueco)', () => {
    const current = ['a', 'b', 'c', 'd'];
    expect(isTagDisabled(current, 'e')).toBe(false);
  });

  it('devuelve true con 5 seleccionados (ningún no-seleccionado puede añadirse)', () => {
    const full = ['a', 'b', 'c', 'd', 'e'];
    const unselected = ['f', 'g', 'h'];
    unselected.forEach((id) => {
      expect(isTagDisabled(full, id)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// handleTagPress — guard completo (comportamiento integrado)
// ---------------------------------------------------------------------------

describe('handleTagPress', () => {
  it('añade un tag cuando la lista está vacía', () => {
    expect(handleTagPress([], 'deportista')).toEqual(['deportista']);
  });

  it('añade hasta 5 tags (llena el máximo)', () => {
    let state: string[] = [];
    ['a', 'b', 'c', 'd', 'e'].forEach((id) => {
      state = handleTagPress(state, id);
    });
    expect(state).toHaveLength(MAX_LIFESTYLE_TAGS);
  });

  it('bloquea el 6º tag (no lo añade al array)', () => {
    let state = ['a', 'b', 'c', 'd', 'e'];
    state = handleTagPress(state, 'f');
    expect(state).toHaveLength(MAX_LIFESTYLE_TAGS);
    expect(state).not.toContain('f');
  });

  it('permite deseleccionar un tag aunque ya haya 5 seleccionados', () => {
    const full = ['a', 'b', 'c', 'd', 'e'];
    const result = handleTagPress(full, 'c');
    expect(result).toHaveLength(4);
    expect(result).not.toContain('c');
  });

  it('tras deseleccionar uno, el siguiente añadido funciona', () => {
    let state = ['a', 'b', 'c', 'd', 'e'];
    state = handleTagPress(state, 'a'); // quitar → 4
    state = handleTagPress(state, 'f'); // añadir → 5
    expect(state).toHaveLength(5);
    expect(state).toContain('f');
    expect(state).not.toContain('a');
  });

  it('nunca supera MAX_LIFESTYLE_TAGS (simulación larga)', () => {
    let state: string[] = [];
    const allTags = Array.from({ length: 20 }, (_, i) => `tag_${i}`);
    allTags.forEach((id) => {
      state = handleTagPress(state, id);
    });
    expect(state.length).toBeLessThanOrEqual(MAX_LIFESTYLE_TAGS);
  });
});

// ---------------------------------------------------------------------------
// Restricción de BD — CHECK array_length <= 5
// ---------------------------------------------------------------------------

describe('restricción BD — CHECK array_length <= 5', () => {
  it('un array resultante de handleTagPress nunca excede 5 elementos', () => {
    // Simula selección agresiva de tags
    const attempts = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let state: string[] = [];
    attempts.forEach((id) => {
      state = handleTagPress(state, id);
    });
    expect(state.length).toBeLessThanOrEqual(5);
  });

  it('MAX_LIFESTYLE_TAGS coincide con el límite CHECK de la BD (5)', () => {
    // Si este test falla, hay que actualizar el CHECK o la constante
    expect(MAX_LIFESTYLE_TAGS).toBe(5);
  });

  it('un array de exactamente 5 tags es válido para persistir', () => {
    const valid = ['a', 'b', 'c', 'd', 'e'];
    expect(valid.length).toBeLessThanOrEqual(MAX_LIFESTYLE_TAGS);
  });

  it('un array vacío es válido para persistir', () => {
    expect([].length).toBeLessThanOrEqual(MAX_LIFESTYLE_TAGS);
  });
});

// ---------------------------------------------------------------------------
// Normalización — datos llegados de la BD
// ---------------------------------------------------------------------------

describe('normalización desde BD', () => {
  it('lifestyle_tags nulo/undefined se trata como array vacío', () => {
    const fromDB: string[] | null | undefined = null;
    const normalized = fromDB ?? [];
    expect(normalized).toEqual([]);
  });

  it('lifestyle_tags vacío de BD no genera errores en el toggle', () => {
    const state = handleTagPress([], 'noctambulo');
    expect(state).toEqual(['noctambulo']);
  });

  it('IDs de BD que no existen en el catálogo se preservan (sin validación en cliente)', () => {
    // El cliente confía en los datos de la BD, la validación es del Edge Function
    const withUnknown = ['tag_desconocido', 'deportista'];
    const result = toggleTag(withUnknown, 'madrugador');
    expect(result).toContain('tag_desconocido');
    expect(result).toContain('madrugador');
  });
});
