/**
 * Tests de comportamiento — PremiumLockWrapper
 *
 * Verifica que el wrapper:
 *   - Usuario free: muestra overlay con candado y botón "Mejorar plan"
 *   - Usuario free: llama a onUpgradePress si se proporciona
 *   - Usuario free: pasa visible=true al UpgradeModal al pulsar el botón
 *   - Usuario premium: renderiza los children directamente sin overlay
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TouchableOpacity, Text } from 'react-native';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('@react-navigation/stack', () => ({}));

// Control de isPremium desde fuera del componente
// (prefijo "mock" para que jest.mock() lo permita como variable out-of-scope)
let mockIsPremium = false;
jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: () => ({ isPremium: mockIsPremium }),
}));

// UpgradeModal mockeado como string component (mismo patrón que BlurView).
// Siempre se renderiza en el árbol; la visibilidad se comprueba con prop `visible`.
jest.mock('../../src/components/UpgradeModal', () => ({
  UpgradeModal: 'MockUpgradeModal',
}));

import { PremiumLockWrapper } from '../../src/components/PremiumLockWrapper';

// ---------------------------------------------------------------------------
// Helper: encuentra un TouchableOpacity que contiene un Text con el label dado
// Usa findAll del test renderer en lugar de JSON.stringify (evita refs circulares)
// ---------------------------------------------------------------------------

const findButtonByLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string
): ReactTestRenderer.ReactTestInstance | undefined =>
  renderer.root
    .findAllByType(TouchableOpacity)
    .find((btn) => {
      try {
        return btn.findAll(
          (n) => n.type === 'Text' && n.props.children === label
        ).length > 0;
      } catch {
        return false;
      }
    });

// ---------------------------------------------------------------------------
// Usuario free
// ---------------------------------------------------------------------------

describe('PremiumLockWrapper — usuario free', () => {
  beforeEach(() => {
    mockIsPremium = false;
  });

  it('muestra el texto "Solo disponible en Premium"', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido bloqueado</Text>
        </PremiumLockWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Solo disponible en Premium');
  });

  it('muestra el botón "Mejorar plan"', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Mejorar plan');
  });

  it('muestra el icono lock-closed', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('lock-closed');
  });

  it('llama a onUpgradePress al pulsar "Mejorar plan"', () => {
    const onUpgrade = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper onUpgradePress={onUpgrade}>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });

    const upgradeBtn = findButtonByLabel(renderer!, 'Mejorar plan');
    ReactTestRenderer.act(() => {
      upgradeBtn?.props.onPress();
    });

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('UpgradeModal tiene visible=false antes de pulsar el botón', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });

    const modal = renderer!.root.findAll((node) => node.type === 'MockUpgradeModal');
    expect(modal.length).toBeGreaterThan(0);
    expect(modal[0].props.visible).toBe(false);
  });

  it('sin onUpgradePress, UpgradeModal pasa a visible=true al pulsar "Mejorar plan"', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });

    const upgradeBtn = findButtonByLabel(renderer!, 'Mejorar plan');
    ReactTestRenderer.act(() => {
      upgradeBtn?.props.onPress();
    });

    const modal = renderer!.root.findAll((node) => node.type === 'MockUpgradeModal');
    expect(modal[0].props.visible).toBe(true);
  });

  it('los children se renderizan con opacidad reducida (bloqueados)', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido bloqueado</Text>
        </PremiumLockWrapper>
      );
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Contenido bloqueado');
    expect(json).toContain('"opacity":0.35');
  });
});

// ---------------------------------------------------------------------------
// Usuario premium
// ---------------------------------------------------------------------------

describe('PremiumLockWrapper — usuario premium', () => {
  beforeEach(() => {
    mockIsPremium = true;
  });

  it('renderiza los children directamente sin ningún overlay', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido desbloqueado</Text>
        </PremiumLockWrapper>
      );
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Contenido desbloqueado');
  });

  it('NO muestra el texto de bloqueo', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).not.toContain('Solo disponible en Premium');
    expect(json).not.toContain('Mejorar plan');
  });

  it('NO renderiza el MockUpgradeModal', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido</Text>
        </PremiumLockWrapper>
      );
    });
    expect(renderer!.root.findAll((n) => n.type === 'MockUpgradeModal')).toHaveLength(0);
  });
});
