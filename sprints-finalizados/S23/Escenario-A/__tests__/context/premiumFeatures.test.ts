import { canUsePremiumFeature, PremiumFeature } from '../../src/constants/premiumFeatures';

describe('premiumFeatures', () => {
  const ALL_FEATURES: PremiumFeature[] = [
    'daily_swipes_extended',
    'advanced_filter_gender',
    'advanced_filter_age',
  ];

  it('allows all premium features for premium users', () => {
    ALL_FEATURES.forEach((feature) => {
      expect(canUsePremiumFeature(true, feature)).toBe(true);
    });
  });

  it('blocks premium features for free users', () => {
    ALL_FEATURES.forEach((feature) => {
      expect(canUsePremiumFeature(false, feature)).toBe(false);
    });
  });
});
