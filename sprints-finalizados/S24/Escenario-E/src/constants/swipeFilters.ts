export const INTERESES_OPTIONS = [
  { id: 'deportes', label: 'Deportes' },
  { id: 'musica', label: 'Musica' },
  { id: 'cine', label: 'Cine' },
  { id: 'arte', label: 'Arte' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'gastronomia', label: 'Gastronomia' },
  { id: 'viajes', label: 'Viajes' },
  { id: 'literatura', label: 'Literatura' },
  { id: 'tecnologia', label: 'Tecnologia' },
  { id: 'moda', label: 'Moda' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'fiesta', label: 'Fiesta' },
  { id: 'series', label: 'Series' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'teatro', label: 'Teatro' },
  { id: 'politica', label: 'Politica' },
  { id: 'activismo', label: 'Activismo' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
];


export const ESTILO_VIDA_OPTIONS = [
  { id: 'schedule_flexible', label: 'Flexible' },
  { id: 'cleaning_muy_limpio', label: 'Muy limpio' },
  { id: 'guests_algunos', label: 'Algunos invitados' },
];

export const lifestyleLabelById = new Map(
  ESTILO_VIDA_OPTIONS.map((option) => [option.id, option.label])
);

export const BUDGET_MIN = 0;
export const BUDGET_MAX = 1200;
export const BUDGET_STEP = 25;
export const DEFAULT_BUDGET_MIN = 0;
export const DEFAULT_BUDGET_MAX = 1200;
