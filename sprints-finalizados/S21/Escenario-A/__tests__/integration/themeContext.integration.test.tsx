import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ThemeProvider, useTheme, useThemeMode } from '../../src/theme/ThemeContext';

type Snapshot = {
  mode: 'light' | 'dark';
  background: string;
};

let latestSnapshot: Snapshot | null = null;
let latestToggle: (() => void) | null = null;

const Probe: React.FC = () => {
  const theme = useTheme();
  const { themeMode, toggleTheme } = useThemeMode();

  latestSnapshot = {
    mode: themeMode,
    background: theme.colors.background,
  };
  latestToggle = toggleTheme;

  return null;
};

describe('ThemeContext integration', () => {
  it('starts in light mode and toggles to dark mode', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
    });

    expect(latestSnapshot).toEqual({
      mode: 'light',
      background: '#FFFFFF',
    });

    act(() => {
      latestToggle?.();
    });

    expect(latestSnapshot).toEqual({
      mode: 'dark',
      background: '#0B1220',
    });

    act(() => {
      tree!.unmount();
    });
  });
});
