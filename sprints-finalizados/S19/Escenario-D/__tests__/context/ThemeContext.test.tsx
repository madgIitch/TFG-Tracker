import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { Text } from 'react-native';

const TestComponent = () => {
  const theme = useTheme();
  return (
    <Text testID="theme-primary">{theme.colors.primary}</Text>
  );
};

describe('ThemeContext', () => {
  it('provides the default theme configuration', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const primaryText = getByTestId('theme-primary');
    expect(primaryText.props.children).toBe('#7C3AED');
  });
});
