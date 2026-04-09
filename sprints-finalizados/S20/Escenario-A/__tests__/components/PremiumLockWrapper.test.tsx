import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { PremiumLockWrapper } from '../../src/components/PremiumLockWrapper';

const mockUsePremium = jest.fn();

jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

describe('PremiumLockWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children directly for premium users', async () => {
    mockUsePremium.mockReturnValue({ isPremium: true, loading: false, refetch: jest.fn() });

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <PremiumLockWrapper>
          <Text>Contenido premium</Text>
        </PremiumLockWrapper>
      );
    });

    const textNodes = tree!.root.findAllByType(Text);
    expect(textNodes.some((node) => node.props.children === 'Contenido premium')).toBe(true);
    expect(textNodes.some((node) => node.props.children === 'Solo disponible en Premium')).toBe(
      false
    );
  });

  it('shows lock overlay and triggers alert when upgrade is pressed', async () => {
    mockUsePremium.mockReturnValue({ isPremium: false, loading: false, refetch: jest.fn() });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <PremiumLockWrapper featureName="Filtro de edad">
          <Text>Bloqueado</Text>
        </PremiumLockWrapper>
      );
    });

    const upgradeButton = tree!.root.findAllByType(TouchableOpacity)[0];
    ReactTestRenderer.act(() => {
      upgradeButton.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Premium',
      'Filtro de edad solo esta disponible para usuarios Premium.'
    );
  });
});
