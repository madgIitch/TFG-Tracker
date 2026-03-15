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
      console.log('[AuthService.persistSession] setSession failed:', error?.message);
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

    console.log('[AuthService.bootstrapSession] refresh failed:', error?.message);
    await this.persistSession(accessToken, refreshToken);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('[AuthService.login] called with email:', credentials.email);

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/auth-login`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(credentials),
    });

    console.log('[AuthService.login] response:', {
      status: response.status,
      ok: response.ok,
      url: response.url,
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
    console.log('[AuthService.loginWithGoogle] Iniciando login con Google');
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;

    console.log('[AuthService.loginWithGoogle] Google idToken exists:', !!idToken);

    if (!idToken) {
      throw new Error('No se pudo obtener el idToken de Google');
    }

    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    console.log('[AuthService.loginWithGoogle] Supabase response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
    });

    if (error) throw error;

    return {
      user: mapSupabaseUserToAppUser(data.user),
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('🔧 AuthService.register() llamado con:', {
      email: userData.email,
      password: userData.password ? '***' : 'vacío',
      firstName: userData.firstName,
      lastName: userData.lastName,
      birthDate: userData.birthDate,
      gender: userData.gender,
    });

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

    console.log('📦 Datos transformados para backend:', {
      ...registerData,
      password: registerData.password ? '***' : 'vacío',
    });

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/auth-register`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(registerData),
    });

    console.log('📥 Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de la API:', errorText);
      throw new Error('Error en el registro');
    }

    const data = await response.json();
    console.log('✅ Datos de respuesta:', data);

    return {
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    };
  }

  async logout(): Promise<void> {
    console.log('[AuthService.logout] Removing authToken from storage');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<string | null> {
    console.log('[AuthService.refreshToken] Attempting refreshSession');

    try {
      const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log('[AuthService.refreshToken] Missing refresh token');
        return null;
      }
      const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });

      console.log('[AuthService.refreshToken] Supabase response:', {
        hasSession: !!data?.session,
        error: error?.message,
      });

      if (error || !data.session) {
        return null;
      }

      await AsyncStorage.setItem('authToken', data.session.access_token);
      await AsyncStorage.setItem(
        AUTH_REFRESH_TOKEN_KEY,
        data.session.refresh_token
      );
      console.log('[AuthService.refreshToken] New token stored');
      return data.session.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Registro por fases
  async registerPhase1(data: Phase1Data): Promise<TempRegistration> {
    console.log('🔧 registerPhase1 called with:', {
      email: data.email,
      hasPassword: !!data.password,
      isGoogleUser: data.isGoogleUser,
    });

    const url = `${API_CONFIG.FUNCTIONS_URL}/auth-register-phase1`;
    console.log('🌐 Fetch URL:', url);
    console.log('🔧 API_CONFIG.FUNCTIONS_URL:', API_CONFIG.FUNCTIONS_URL);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          is_google_user: data.isGoogleUser,
        }),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error('Error en fase 1 del registro');
      }

      const result = await response.json();
      console.log('✅ Phase1 response:', result);

      return {
        tempToken: result.temp_token,
        email: result.email,
        isGoogleUser: data.isGoogleUser || false,
      };
    } catch (error) {
      console.error('❌ registerPhase1 error:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack =
        error instanceof Error ? error.stack : 'No stack available';
      const errorName = error instanceof Error ? error.name : 'Unknown';

      console.error('❌ Error details:', {
        message: errorMessage,
        stack: errorStack,
        name: errorName,
      });
      throw error;
    }
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
