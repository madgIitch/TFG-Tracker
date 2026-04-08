// src/constants/lifestyleTags.ts

export interface LifestyleTag {
  id: string;
  label: string;
  emoji: string;
}

export const LIFESTYLE_TAGS: LifestyleTag[] = [
  { id: 'madrugador', label: 'Madrugador', emoji: '\u{1F305}' },
  { id: 'noctambulo', label: 'Noctámbulo', emoji: '\u{1F319}' },
  { id: 'no_fumador', label: 'No fumador', emoji: '\u{1F6AD}' },
  { id: 'fumador', label: 'Fumador', emoji: '\u{1F6AC}' },
  { id: 'deportista', label: 'Deportista', emoji: '\u{1F4AA}' },
  { id: 'tiene_mascota', label: 'Tiene mascota', emoji: '\u{1F43E}' },
  { id: 'sin_mascotas', label: 'Sin mascotas', emoji: '\u{1F6AB}' },
  { id: 'vegetariano', label: 'Vegetariano', emoji: '\u{1F966}' },
  { id: 'teletrabajo', label: 'Teletrabajo', emoji: '\u{1F4BB}' },
  { id: 'musica_en_casa', label: 'Música en casa', emoji: '\u{1F3B5}' },
  { id: 'silencio', label: 'Silencio', emoji: '\u{1F507}' },
  { id: 'muy_ordenado', label: 'Muy ordenado', emoji: '\u{1F9F9}' },
  { id: 'sociable', label: 'Sociable', emoji: '\u{1F465}' },
  { id: 'introvertido', label: 'Introvertido', emoji: '\u{1F3E0}' },
  { id: 'cocina_en_casa', label: 'Cocina en casa', emoji: '\u{1F373}' },
];

export const MAX_LIFESTYLE_TAGS = 5;

export const lifestyleTagById = new Map<string, LifestyleTag>(
  LIFESTYLE_TAGS.map((tag) => [tag.id, tag])
);
