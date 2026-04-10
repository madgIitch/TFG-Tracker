export type PremiumFeature =
  | 'daily_swipes_extended'
  | 'advanced_filter_gender'
  | 'advanced_filter_age';

export const PREMIUM_FEATURE_COPY: Record<
  PremiumFeature,
  { title: string; description: string }
> = {
  daily_swipes_extended: {
    title: 'Swipes ilimitados',
    description: 'Descubre mas perfiles sin limite diario.',
  },
  advanced_filter_gender: {
    title: 'Filtro por genero',
    description: 'Ajusta los matches segun tu preferencia.',
  },
  advanced_filter_age: {
    title: 'Filtro por edad',
    description: 'Define el rango de edad que buscas.',
  },
};

export const canUsePremiumFeature = (
  isPremium: boolean,
  feature: PremiumFeature
): boolean => {
  if (isPremium) return true;

  switch (feature) {
    case 'daily_swipes_extended':
    case 'advanced_filter_gender':
    case 'advanced_filter_age':
      return false;
    default:
      return false;
  }
};
