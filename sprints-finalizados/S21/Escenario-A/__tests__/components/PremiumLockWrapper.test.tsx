import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { PremiumLockWrapper } from '../../src/components/PremiumLockWrapper';

const mockUsePremium = jest.fn();

jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('../../src/components/PremiumBadge', () => ({
  PremiumBadge: () => null,
}));

describe('PremiumLockWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children directly for premium users', async () => {
    mockUsePremium.mockReturnValue({
      isPremium: true,
      loading: false,
      refetch: jest.fn(),
      canUse: () => true,
      requireFeature: (_: string, onAllowed: () => void) => onAllowed(),
    });

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <PremiumLockWrapper feature="advanced_filter_age">
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

  it('shows lock overlay and triggers onLockedPress when upgrade is pressed', async () => {
    mockUsePremium.mockReturnValue({
      isPremium: false,
      loading: false,
      refetch: jest.fn(),
      canUse: () => false,
      requireFeature: (_: string, _onAllowed: () => void, onBlocked?: () => void) =>
        onBlocked?.(),
    });
    const onLockedPress = jest.fn();

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <PremiumLockWrapper
          feature="advanced_filter_age"
          featureName="Filtro de edad"
          onLockedPress={onLockedPress}
        >
          <Text>Bloqueado</Text>
        </PremiumLockWrapper>
      );
    });

    const upgradeButton = tree!.root.findAllByType(TouchableOpacity)[0];
    ReactTestRenderer.act(() => {
      upgradeButton.props.onPress();
    });

    expect(onLockedPress).toHaveBeenCalledTimes(1);
  });
});
