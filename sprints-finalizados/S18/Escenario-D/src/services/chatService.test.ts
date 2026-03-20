import { chatService } from './chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencias
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

// Mock de la funcion fetch
global.fetch = jest.fn() as jest.Mock;

describe('chatService - Regresión de Matches/Chats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMatches() filtra y devuelve solo los registros con status = "accepted"', async () => {
    // Configurar Auth
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve('mock-token');
      if (key === 'authUser') return Promise.resolve(JSON.stringify({ id: 'user_A' }));
      return Promise.resolve(null);
    });

    // Configurar respuesta del fetch con matches mixtos
    const mockApiResponse = {
      data: [
        {
          id: 'match_1',
          user_a_id: 'user_A',
          user_b_id: 'user_B',
          status: 'accepted',
          matched_at: '2025-01-01',
          user_b: { id: 'user_B', display_name: 'Usuario B' },
        },
        {
          id: 'match_2',
          user_a_id: 'user_A',
          user_b_id: 'user_C',
          status: 'pending', // No debería devolverse
          matched_at: '2025-01-02',
          user_b: { id: 'user_C', display_name: 'Usuario C' },
        },
        {
          id: 'match_3',
          user_a_id: 'user_D',
          user_b_id: 'user_A',
          status: 'accepted',
          matched_at: '2025-01-03',
          user_a: { id: 'user_D', display_name: 'Usuario D' },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const matches = await chatService.getMatches();

    // Verificamos que solo devuelva 2 (los aceptados)
    expect(matches).toHaveLength(2);
    
    // Verificamos los contenidos
    expect(matches[0].id).toBe('match_1');
    expect(matches[0].status).toBe('accepted');
    expect(matches[0].profileId).toBe('user_B');

    expect(matches[1].id).toBe('match_3');
    expect(matches[1].status).toBe('accepted');
    expect(matches[1].profileId).toBe('user_D');
  });
});
