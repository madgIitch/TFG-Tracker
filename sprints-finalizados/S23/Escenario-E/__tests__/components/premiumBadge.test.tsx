/**
 * Tests de renderizado — PremiumBadge
 *
 * Verifica que el componente:
 *   - Renderiza sin errores en ambos tamaños (sm / md)
 *   - Muestra el texto "Premium"
 *   - Aplica estilos de tamaño correctos según la prop size
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

import { PremiumBadge } from '../../src/components/PremiumBadge';

describe('PremiumBadge — renderizado', () => {
  it('renderiza sin errores con tamaño md (por defecto)', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge />);
    });
    expect(renderer!.toJSON()).not.toBeNull();
  });

  it('renderiza sin errores con tamaño sm', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge size="sm" />);
    });
    expect(renderer!.toJSON()).not.toBeNull();
  });

  it('contiene el texto "Premium"', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge />);
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Premium');
  });

  it('incluye el icono lock-closed', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge />);
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('lock-closed');
  });
});

describe('PremiumBadge — tamaños', () => {
  it('tamaño sm aplica fontSize 10 al texto', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge size="sm" />);
    });
    // Busca el nodo Text que contiene "Premium"
    const textNodes = renderer!.root.findAll(
      (node) => node.type === 'Text' && node.props.children === 'Premium'
    );
    expect(textNodes.length).toBeGreaterThan(0);
    const style = Array.isArray(textNodes[0].props.style)
      ? Object.assign({}, ...textNodes[0].props.style)
      : textNodes[0].props.style;
    expect(style.fontSize).toBe(10);
  });

  it('tamaño md aplica fontSize 12 al texto', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge size="md" />);
    });
    const textNodes = renderer!.root.findAll(
      (node) => node.type === 'Text' && node.props.children === 'Premium'
    );
    expect(textNodes.length).toBeGreaterThan(0);
    const style = Array.isArray(textNodes[0].props.style)
      ? Object.assign({}, ...textNodes[0].props.style)
      : textNodes[0].props.style;
    expect(style.fontSize).toBe(12);
  });

  it('tamaño sm pasa size=9 al icono', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge size="sm" />);
    });
    const icon = renderer!.root.findAll((node) => node.type === 'Ionicons');
    expect(icon[0].props.size).toBe(9);
  });

  it('tamaño md pasa size=11 al icono', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PremiumBadge size="md" />);
    });
    const icon = renderer!.root.findAll((node) => node.type === 'Ionicons');
    expect(icon[0].props.size).toBe(11);
  });
});
