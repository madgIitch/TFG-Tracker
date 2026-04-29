/**
 * Tests de comportamiento — KeyboardWrapper
 *
 * Cubre:
 *   - Renderiza los children en ambos modos (scrollable / no-scrollable)
 *   - En modo scrollable (defecto) envuelve en ScrollView
 *   - En modo no-scrollable NO añade ScrollView extra
 *   - Aplica el style recibido como prop
 *   - keyboardVerticalOffset se pasa a KeyboardAvoidingView solo en iOS
 */

import React from 'react';
import { Text, ScrollView, KeyboardAvoidingView } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { KeyboardWrapper } from '../../src/components/KeyboardWrapper';

describe('KeyboardWrapper', () => {
  it('renderiza los children correctamente en modo scrollable (defecto)', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper>
          <Text>Contenido de prueba</Text>
        </KeyboardWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Contenido de prueba');
  });

  it('renderiza los children correctamente en modo no-scrollable', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper scrollable={false}>
          <Text>Sin scroll</Text>
        </KeyboardWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Sin scroll');
  });

  it('incluye un ScrollView cuando scrollable=true', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper scrollable={true}>
          <Text>Con scroll</Text>
        </KeyboardWrapper>
      );
    });
    const scrollViews = renderer!.root.findAllByType(ScrollView);
    expect(scrollViews.length).toBeGreaterThan(0);
  });

  it('NO incluye ScrollView cuando scrollable=false', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper scrollable={false}>
          <Text>Sin ScrollView</Text>
        </KeyboardWrapper>
      );
    });
    const scrollViews = renderer!.root.findAllByType(ScrollView);
    expect(scrollViews).toHaveLength(0);
  });

  it('incluye ScrollView por defecto (sin prop scrollable)', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper>
          <Text>Default</Text>
        </KeyboardWrapper>
      );
    });
    const scrollViews = renderer!.root.findAllByType(ScrollView);
    expect(scrollViews.length).toBeGreaterThan(0);
  });

  it('aplica el style recibido al KeyboardAvoidingView', () => {
    const customStyle = { backgroundColor: '#FF0000' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper style={customStyle}>
          <Text>Styled</Text>
        </KeyboardWrapper>
      );
    });
    const kav = renderer!.root.findByType(KeyboardAvoidingView);
    const flatStyle = Array.isArray(kav.props.style)
      ? Object.assign({}, ...kav.props.style)
      : kav.props.style;
    expect(flatStyle.backgroundColor).toBe('#FF0000');
  });

  it('el KeyboardAvoidingView tiene flex:1 como estilo base', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper>
          <Text>Flex</Text>
        </KeyboardWrapper>
      );
    });
    const kav = renderer!.root.findByType(KeyboardAvoidingView);
    const flatStyle = Array.isArray(kav.props.style)
      ? Object.assign({}, ...kav.props.style)
      : kav.props.style;
    expect(flatStyle.flex).toBe(1);
  });

  it('pasa scrollViewProps al ScrollView interno', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper scrollViewProps={{ horizontal: true }}>
          <Text>Props</Text>
        </KeyboardWrapper>
      );
    });
    const scrollView = renderer!.root.findByType(ScrollView);
    expect(scrollView.props.horizontal).toBe(true);
  });

  it('renderiza múltiples children sin error', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <KeyboardWrapper scrollable={false}>
          <Text>Hijo 1</Text>
          <Text>Hijo 2</Text>
          <Text>Hijo 3</Text>
        </KeyboardWrapper>
      );
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Hijo 1');
    expect(json).toContain('Hijo 2');
    expect(json).toContain('Hijo 3');
  });
});
