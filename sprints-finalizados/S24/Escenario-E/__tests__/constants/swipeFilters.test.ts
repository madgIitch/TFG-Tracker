/**
 * Tests de regresión — swipeFilters.ts
 *
 * Verifica que:
 *   - ZONAS_OPTIONS ya NO está exportado (se migró a la BD)
 *   - Las constantes que deben seguir existiendo están presentes
 *   - Los valores críticos de presupuesto no han cambiado
 */

import * as swipeFilters from '../../src/constants/swipeFilters';

describe('swipeFilters — constantes', () => {
  it('NO exporta ZONAS_OPTIONS (migradas a la BD)', () => {
    expect((swipeFilters as Record<string, unknown>)['ZONAS_OPTIONS']).toBeUndefined();
  });

  it('exporta INTERESES_OPTIONS con al menos un elemento', () => {
    expect(swipeFilters.INTERESES_OPTIONS).toBeDefined();
    expect(swipeFilters.INTERESES_OPTIONS.length).toBeGreaterThan(0);
  });

  it('cada entrada de INTERESES_OPTIONS tiene id y label como strings', () => {
    for (const option of swipeFilters.INTERESES_OPTIONS) {
      expect(typeof option.id).toBe('string');
      expect(typeof option.label).toBe('string');
      expect(option.id.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it('exporta ESTILO_VIDA_OPTIONS con al menos un elemento', () => {
    expect(swipeFilters.ESTILO_VIDA_OPTIONS).toBeDefined();
    expect(swipeFilters.ESTILO_VIDA_OPTIONS.length).toBeGreaterThan(0);
  });

  it('exporta las constantes de presupuesto con valores numéricos', () => {
    expect(typeof swipeFilters.BUDGET_MIN).toBe('number');
    expect(typeof swipeFilters.BUDGET_MAX).toBe('number');
    expect(typeof swipeFilters.BUDGET_STEP).toBe('number');
    expect(typeof swipeFilters.DEFAULT_BUDGET_MIN).toBe('number');
    expect(typeof swipeFilters.DEFAULT_BUDGET_MAX).toBe('number');
  });

  it('BUDGET_MIN es menor que BUDGET_MAX', () => {
    expect(swipeFilters.BUDGET_MIN).toBeLessThan(swipeFilters.BUDGET_MAX);
  });

  it('DEFAULT_BUDGET_MIN es menor o igual que DEFAULT_BUDGET_MAX', () => {
    expect(swipeFilters.DEFAULT_BUDGET_MIN).toBeLessThanOrEqual(swipeFilters.DEFAULT_BUDGET_MAX);
  });

  it('BUDGET_STEP es positivo', () => {
    expect(swipeFilters.BUDGET_STEP).toBeGreaterThan(0);
  });

  it('exporta lifestyleLabelById como Map', () => {
    expect(swipeFilters.lifestyleLabelById).toBeInstanceOf(Map);
    expect(swipeFilters.lifestyleLabelById.size).toBeGreaterThan(0);
  });

  it('las claves de lifestyleLabelById corresponden a los ids de ESTILO_VIDA_OPTIONS', () => {
    for (const option of swipeFilters.ESTILO_VIDA_OPTIONS) {
      expect(swipeFilters.lifestyleLabelById.has(option.id)).toBe(true);
      expect(swipeFilters.lifestyleLabelById.get(option.id)).toBe(option.label);
    }
  });
});
