/**
 * Tests unitarios para src/constants/lifestyleTags.ts
 *
 * Verifica la integridad del catálogo de etiquetas de estilo de vida:
 * - estructura de cada entrada
 * - unicidad de IDs
 * - coherencia del mapa de búsqueda
 * - límite máximo impuesto por la BD (CHECK array_length <= 5)
 */

import {
  LIFESTYLE_TAGS,
  MAX_LIFESTYLE_TAGS,
  lifestyleTagById,
} from '../../src/constants/lifestyleTags';

// ---------------------------------------------------------------------------
// Catálogo — estructura e integridad
// ---------------------------------------------------------------------------

describe('LIFESTYLE_TAGS — estructura', () => {
  it('contiene exactamente 15 entradas', () => {
    expect(LIFESTYLE_TAGS).toHaveLength(15);
  });

  it('cada etiqueta tiene id, label y emoji como strings no vacíos', () => {
    LIFESTYLE_TAGS.forEach((tag) => {
      expect(typeof tag.id).toBe('string');
      expect(tag.id.length).toBeGreaterThan(0);

      expect(typeof tag.label).toBe('string');
      expect(tag.label.length).toBeGreaterThan(0);

      expect(typeof tag.emoji).toBe('string');
      expect(tag.emoji.length).toBeGreaterThan(0);
    });
  });

  it('los IDs son únicos', () => {
    const ids = LIFESTYLE_TAGS.map((tag) => tag.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('los labels son únicos', () => {
    const labels = LIFESTYLE_TAGS.map((tag) => tag.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

  it('los IDs no contienen espacios (son válidos como valores de BD)', () => {
    LIFESTYLE_TAGS.forEach((tag) => {
      expect(tag.id).not.toMatch(/\s/);
    });
  });

  it('los IDs usan snake_case', () => {
    LIFESTYLE_TAGS.forEach((tag) => {
      // solo letras minúsculas y guiones bajos
      expect(tag.id).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });
});

// ---------------------------------------------------------------------------
// Catálogo — etiquetas esperadas presentes
// ---------------------------------------------------------------------------

describe('LIFESTYLE_TAGS — etiquetas esperadas', () => {
  const ids = new Set(LIFESTYLE_TAGS.map((t) => t.id));

  it.each([
    'madrugador',
    'noctambulo',
    'no_fumador',
    'fumador',
    'deportista',
    'tiene_mascota',
    'sin_mascotas',
    'vegetariano',
    'teletrabajo',
    'musica_en_casa',
    'silencio',
    'muy_ordenado',
    'sociable',
    'introvertido',
    'cocina_en_casa',
  ])('contiene la etiqueta "%s"', (id) => {
    expect(ids.has(id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MAX_LIFESTYLE_TAGS — alineado con la restricción CHECK de la BD
// ---------------------------------------------------------------------------

describe('MAX_LIFESTYLE_TAGS', () => {
  it('es exactamente 5 (CHECK array_length <= 5 en profiles)', () => {
    expect(MAX_LIFESTYLE_TAGS).toBe(5);
  });

  it('es un número positivo', () => {
    expect(MAX_LIFESTYLE_TAGS).toBeGreaterThan(0);
  });

  it('es menor que el total de etiquetas disponibles', () => {
    expect(MAX_LIFESTYLE_TAGS).toBeLessThan(LIFESTYLE_TAGS.length);
  });
});

// ---------------------------------------------------------------------------
// lifestyleTagById — mapa de búsqueda
// ---------------------------------------------------------------------------

describe('lifestyleTagById', () => {
  it('tiene el mismo número de entradas que LIFESTYLE_TAGS', () => {
    expect(lifestyleTagById.size).toBe(LIFESTYLE_TAGS.length);
  });

  it('resuelve correctamente una etiqueta conocida', () => {
    const tag = lifestyleTagById.get('deportista');
    expect(tag).toBeDefined();
    expect(tag?.label).toBe('Deportista');
  });

  it('devuelve undefined para un ID desconocido', () => {
    expect(lifestyleTagById.get('no_existe')).toBeUndefined();
  });

  it('cada ID de LIFESTYLE_TAGS tiene una entrada en el mapa', () => {
    LIFESTYLE_TAGS.forEach((tag) => {
      expect(lifestyleTagById.has(tag.id)).toBe(true);
    });
  });

  it('el objeto recuperado del mapa es idéntico al de LIFESTYLE_TAGS', () => {
    LIFESTYLE_TAGS.forEach((tag) => {
      expect(lifestyleTagById.get(tag.id)).toBe(tag);
    });
  });
});
