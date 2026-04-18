import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MatchesScreen } from '../../src/screens/MatchesScreen';
import { supabaseClient } from '../../src/services/authService';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { chatService } from '../../src/services/chatService';

jest.mock('../../src/services/authService', () => ({
  ...jest.requireActual('../../src/services/authService'),
  supabaseClient: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
    realtime: {
      setAuth: jest.fn(),
    }
  }
}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn() }
}));
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/messaging', () => () => ({}));
jest.mock('../../src/services/chatService');
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/messaging', () => () => ({}));

describe('MatchesScreen Realtime', () => {
  it('subscribes to postgres_changes for matches table on mount', async () => {
    const onMock = jest.fn().mockReturnThis();
    const subscribeMock = jest.fn();
    (supabaseClient.channel as jest.Mock).mockReturnValue({
      on: onMock,
      subscribe: subscribeMock,
    });
    
    (chatService.getMatches as jest.Mock).mockResolvedValue([]);

    render(
      <ThemeProvider>
        <NavigationContainer>
          <MatchesScreen />
        </NavigationContainer>
      </ThemeProvider>
    );

    // Wait for the async component logic
    await waitFor(() => {
      expect(supabaseClient.channel).toHaveBeenCalledWith('matches-changes');
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        expect.any(Function)
      );
      expect(subscribeMock).toHaveBeenCalled();
    });
  });
});
