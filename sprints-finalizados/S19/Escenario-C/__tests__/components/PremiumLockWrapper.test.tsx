import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { PremiumLockWrapper } from '../../src/components/PremiumLockWrapper';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const mockUsePremium = jest.fn();

jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

describe('PremiumLockWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAct = async (node: React.ReactElement) => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(node);
    });
    return tree!;
  };

  it('renders children directly for premium users', async () => {
    mockUsePremium.mockReturnValue({ isPremium: true, loading: false });

    const tree = await renderWithAct(
      <PremiumLockWrapper>
        <Text>Contenido premium</Text>
      </PremiumLockWrapper>
    );

    const texts = tree.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain('Contenido premium');
    expect(texts).not.toContain('Mejorar plan');
  });

  it('shows lock CTA for non-premium users', async () => {
    mockUsePremium.mockReturnValue({ isPremium: false, loading: false });
    const onUpgradePress = jest.fn();

    const tree = await renderWithAct(
      <PremiumLockWrapper featureName="Filtro de edad" onUpgradePress={onUpgradePress}>
        <Text>Bloqueado</Text>
      </PremiumLockWrapper>
    );

    const texts = tree.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain('Mejorar plan');
    expect(texts.some((value) => String(value).includes('Filtro de edad'))).toBe(true);
  });
});
