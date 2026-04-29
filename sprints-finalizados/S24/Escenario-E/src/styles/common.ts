// src/styles/common.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

/** Styles shared by all 4 register phase screens. */
export const makeRegisterPhaseStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

/** Slider styles used in EditProfileScreen and FiltersScreen. */
export const makeSliderStyles = (theme: Theme) => StyleSheet.create({
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.separator,
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: -7,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderTick: {
    width: 2,
    height: 6,
    backgroundColor: theme.colors.separator,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

// Aliases estáticos (retrocompatibilidad para código que no migra todavía)
import { lightTheme } from '../theme';
/** @deprecated Usa makeRegisterPhaseStyles(theme) */
export const registerPhaseStyles = makeRegisterPhaseStyles(lightTheme);
/** @deprecated Usa makeSliderStyles(theme) */
export const sliderStyles = makeSliderStyles(lightTheme);
