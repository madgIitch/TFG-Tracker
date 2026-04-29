// src/services/authService.ts
import {
  User,
  LoginRequest,
  RegisterRequest,
  Phase1Data,
  Phase2Data,
  PhaseGenderData,
  Phase3Data,
  TempRegistration,
} from '../types/auth';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  API_CONFIG.SUPABASE_URL,
  API_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Función auxiliar para mapear el usuario
const mapSupabaseUserToAppUser = (supabaseUser: any): User => {
  const fullName = supabaseUser.user_metadata?.full_name || '';
  const nameParts = fullName.split(' ');

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    first_name:
      supabaseUser.user_metadata?.first_name || nameParts[0] || '',
    last_name:
      supabaseUser.user_metadata?.last_name ||
      nameParts.slice(1).join(' ') ||
      '',
    birth_date: supabaseUser.user_metadata?.birth_date || '',
    gender: supabaseUser.user_metadata?.gender ?? null,
    identity_document: supabaseUser.user_metadata?.identity_document,
    created_at: supabaseUser.created_at,
  };
};

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string | null;
  isNewUser?: boolean;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  apikey: API_CONFIG.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
};

const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';

class AuthService {
  async persistSession(
    accessToken: string,
    refreshToken?: string | null
  ): Promise<void> {
    if (!refreshToken) {
      await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      return;
    }

    await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);

    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      const refreshAttempt = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
      if (refreshAttempt.data.session) {
        await AsyncStorage.setItem(
          'authToken',
          refreshAttempt.data.session.access_token
        );
        await AsyncStorage.setItem(
          AUTH_REFRESH_TOKEN_KEY,
          refreshAttempt.data.session.refresh_token
        );
      }
      return;
    }

    await AsyncStorage.setItem('authToken', data.session.access_token);
    await AsyncStorage.setItem(
      AUTH_REFRESH_TOKEN_KEY,
      data.session.refresh_token
    );
  }

  async bootstrapSession(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    const accessToken = await AsyncStorage.getItem('authToken');

    if (!refreshToken || !accessToken) {
      return;
    }

    const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
    if (data.session) {
      await AsyncStorage.setItem('authToken', data.session.access_token);
      await AsyncStorage.setItem(
        AUTH_REFRESH_TOKEN_KEY,
        data.session.refresh_token
      );
      return;
    }

    await this.persistSession(accessToken, refreshToken);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/auth-login`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error login API:', errorText);
      throw new Error('Credenciales inválidas');
    }

    const data = await response.json();
    return {
      user: data.user,
      token: data.access_token || data.token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    };
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;

    if (!idToken) {
      throw new Error('No se pudo obtener el idToken de Google');
    }

    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;

    // Detect if user is new by checking if a profile record exists
    let isNewUser = false;
    try {
      const token = data.session.access_token;
      const headers = {
        'Content-Type': 'application/json',
        apikey: API_CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      };
      const profileResponse = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
        method: 'GET',
        headers,
      });
      if (profileResponse.status === 404) {
        isNewUser = true;
      } else if (!profileResponse.ok) {
        throw new Error(`Profile check failed: ${profileResponse.status}`);
      }
    } catch (profileError) {
      console.warn('[authService] Could not determine isNewUser:', profileError);
      isNewUser = false;
    }

    return {
      user: mapSupabaseUserToAppUser(data.user),
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      isNewUser,
    };
  }

  async completeGoogleRegistration(
    token: string,
    data: { firstName: string; lastName: string; gender: string; birthDate: string }
  ): Promise<void> {
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/auth-register-phase3`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: API_CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_google_user: true,
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender,
          birth_date: data.birthDate,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en Google registration:', errorText);
      throw new Error('Error al completar el registro con Google');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const registerData = {
      email: userData.email,
      password: userData.password,
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        birth_date: userData.birthDate,
        gender: userData.gender,
      },
    };

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/auth-register`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de la API:', errorText);
      throw new Error('Error en el registro');
    }

    const data = await response.json();

    return {
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    };
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }
      const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        return null;
      }

      await AsyncStorage.setItem('authToken', data.session.access_token);
      await AsyncStorage.setItem(
        AUTH_REFRESH_TOKEN_KEY,
        data.session.refresh_token
      );
      return data.session.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Registro por fases
  async registerPhase1(data: Phase1Data): Promise<TempRegistration> {
    const url = `${API_CONFIG.FUNCTIONS_URL}/auth-register-phase1`;

    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        is_google_user: data.isGoogleUser,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en fase 1 del registro:', errorText);
      throw new Error('Error en fase 1 del registro');
    }

    const result = await response.json();
    return {
      tempToken: result.temp_token,
      email: result.email,
      isGoogleUser: data.isGoogleUser || false,
    };
  }

  async registerPhase2(tempToken: string, data: PhaseGenderData): Promise<void> {
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/auth-register-phase2`,
      {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          temp_token: tempToken,
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en fase 2 del registro:', errorText);
      throw new Error('Error en fase 2 del registro');
    }
  }

  async registerPhase3(
    tempToken: string,
    data: Phase3Data
  ): Promise<AuthResponse> {
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/auth-register-phase3`,
      {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          temp_token: tempToken,
          birth_date: data.birthDate,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en fase 3 del registro:', errorText);
      throw new Error('Error en fase 3 del registro');
    }

    const result = await response.json();
    return {
      user: result.user,
      token: result.access_token,
      refreshToken: result.refresh_token ?? result.refreshToken ?? null,
    };
  }

  // Limpiar registro temporal (útil si el usuario abandona el proceso)
  async clearTempRegistration(): Promise<void> {
    await AsyncStorage.removeItem('tempRegistration');
  }

  async deleteAccount(): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('No hay sesión activa');

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        apikey: API_CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error eliminando cuenta:', errorText);
      throw new Error('No se pudo eliminar la cuenta');
    }

    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authRefreshToken');
  }

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'homimatch://reset-password',
    });
    if (error) throw error;
  }

  async resetPassword(
    newPassword: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    const { error: sessionError } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }
}

export const authService = new AuthService();
