import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme, useThemeMode } from '../../src/theme/ThemeContext';

const TestConsumer: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();

  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="textColor">{theme.colors.text}</Text>
      <TouchableOpacity testID="toggle" onPress={toggleMode}>
        <Text>toggle</Text>
      </TouchableOpacity>
    </>
  );
};

describe('ThemeContext integration', () => {
  it('starts in light mode and exposes theme tokens', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
    });

    const modeText = tree!.root.findByProps({ testID: 'mode' });
    const colorText = tree!.root.findByProps({ testID: 'textColor' });

    expect(modeText.props.children).toBe('light');
    expect(typeof colorText.props.children).toBe('string');
  });

  it('toggles mode from light to dark', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
    });

    const toggleButton = tree!.root.findByProps({ testID: 'toggle' });

    await ReactTestRenderer.act(async () => {
      toggleButton.props.onPress();
    });

    const modeText = tree!.root.findByProps({ testID: 'mode' });
    expect(modeText.props.children).toBe('dark');
  });
});
