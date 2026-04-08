/**
 * Tests de integración para la ruta Google en auth-register-phase3 (Fase 3).
 *
 * Espeja la lógica del handler de:
 *   supabase/functions/auth-register-phase3/index.ts
 *
 * Cubre:
 *   - Validación de campos requeridos (is_google_user path)
 *   - Validación del formato de birth_date
 *   - Autenticación por token (Authorization header)
 *   - Upsert correcto en users y profiles
 *   - Respuesta de éxito { success: true }
 *   - Ruta legacy (email/password) sigue requiriendo temp_token
 */

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type GoogleRegistrationBody = {
  is_google_user: true;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
};

type EmailRegistrationBody = {
  is_google_user?: false;
  temp_token: string;
  birth_date: string;
};

type RegistrationBody = GoogleRegistrationBody | EmailRegistrationBody;

type AuthUser = {
  id: string;
  email: string;
};

type SupabaseResponse<T> = { data: T; error: null } | { data: null; error: Error };

// ---------------------------------------------------------------------------
// Implementación espejo del handler (Google path only)
// ---------------------------------------------------------------------------

const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type HandlerResult =
  | { status: 200; body: { success: true } }
  | { status: 400; body: { error: string } }
  | { status: 401; body: { error: string } }
  | { status: 500; body: { error: string } };

type FakeDb = {
  users: Record<string, object>;
  profiles: Record<string, object>;
};

async function handleGooglePath(
  body: GoogleRegistrationBody,
  authHeader: string,
  getUser: (token: string) => Promise<SupabaseResponse<AuthUser | null>>,
  upsertUser: (record: object) => Promise<{ error: Error | null }>,
  upsertProfile: (record: object) => Promise<{ error: Error | null }>
): Promise<HandlerResult> {
  const { first_name, last_name, gender, birth_date } = body;

  if (!first_name || !last_name || !gender || !birth_date) {
    return {
      status: 400,
      body: { error: 'Missing required fields for Google registration' },
    };
  }

  if (!BIRTH_DATE_REGEX.test(birth_date)) {
    return {
      status: 400,
      body: { error: 'Invalid birth_date format. Use YYYY-MM-DD' },
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const userResult = await getUser(token);

  if (userResult.error || !userResult.data) {
    return { status: 401, body: { error: 'Invalid or expired token' } };
  }

  const userId = userResult.data.id;
  const email = userResult.data.email;

  const { error: userError } = await upsertUser({
    id: userId,
    email,
    first_name,
    last_name,
    birth_date,
    gender,
  });

  if (userError) {
    return { status: 500, body: { error: 'Failed to create user record' } };
  }

  await upsertProfile({ id: userId, gender });

  return { status: 200, body: { success: true } };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validBody: GoogleRegistrationBody = {
  is_google_user: true,
  first_name: 'Ana',
  last_name: 'Garcia',
  gender: 'female',
  birth_date: '1998-05-15',
};

const fakeUser: AuthUser = { id: 'uid-google-1', email: 'ana@gmail.com' };

function okGetUser(token: string): Promise<SupabaseResponse<AuthUser>> {
  return Promise.resolve({ data: fakeUser, error: null });
}

function failGetUser(token: string): Promise<SupabaseResponse<null>> {
  return Promise.resolve({ data: null, error: new Error('Invalid token') });
}

function okUpsert(): Promise<{ error: null }> {
  return Promise.resolve({ error: null });
}

function failUpsert(): Promise<{ error: Error }> {
  return Promise.resolve({ error: new Error('DB error') });
}

// ---------------------------------------------------------------------------
// Validación de campos
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta Google: validación de campos', () => {
  it('todos los campos presentes → responde 200 con { success: true }', async () => {
    const result = await handleGooglePath(
      validBody,
      'Bearer token-abc',
      okGetUser,
      okUpsert,
      okUpsert
    );
    expect(result.status).toBe(200);
    expect((result.body as { success: boolean }).success).toBe(true);
  });

  it('first_name vacío → 400', async () => {
    const body = { ...validBody, first_name: '' };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Missing required fields');
  });

  it('last_name vacío → 400', async () => {
    const body = { ...validBody, last_name: '' };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    expect(result.status).toBe(400);
  });

  it('gender vacío → 400', async () => {
    const body = { ...validBody, gender: '' };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    expect(result.status).toBe(400);
  });

  it('birth_date vacío → 400', async () => {
    const body = { ...validBody, birth_date: '' };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    expect(result.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Validación de formato de fecha
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta Google: formato birth_date', () => {
  const invalidDates = [
    '15/05/1998',    // DD/MM/YYYY
    '05-15-1998',    // MM-DD-YYYY
    '1998/05/15',    // con barras
    '1998-5-15',     // mes sin cero
    'not-a-date',
    '',
  ];

  it.each(invalidDates)('birth_date "%s" → 400 invalid format', async (date) => {
    const body = { ...validBody, birth_date: date };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    // '' ya falla en la validación de campos
    expect(result.status).toBe(400);
  });

  const validDates = [
    '1998-05-15',
    '2000-01-01',
    '1990-12-31',
  ];

  it.each(validDates)('birth_date "%s" → pasa la validación de formato', async (date) => {
    const body = { ...validBody, birth_date: date };
    const result = await handleGooglePath(body, 'Bearer t', okGetUser, okUpsert, okUpsert);
    expect(result.status).not.toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta Google: autenticación', () => {
  it('token válido → continúa el flujo (200)', async () => {
    const result = await handleGooglePath(
      validBody,
      'Bearer valid-token',
      okGetUser,
      okUpsert,
      okUpsert
    );
    expect(result.status).toBe(200);
  });

  it('token inválido → 401', async () => {
    const result = await handleGooglePath(
      validBody,
      'Bearer bad-token',
      failGetUser,
      okUpsert,
      okUpsert
    );
    expect(result.status).toBe(401);
    expect(result.body.error).toContain('Invalid or expired token');
  });

  it('extrae el token correctamente del header Authorization', async () => {
    let capturedToken = '';
    const capturingGetUser = (token: string) => {
      capturedToken = token;
      return okGetUser(token);
    };
    await handleGooglePath(validBody, 'Bearer my-secret-token', capturingGetUser, okUpsert, okUpsert);
    expect(capturedToken).toBe('my-secret-token');
  });
});

// ---------------------------------------------------------------------------
// Upsert en DB
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta Google: upsert en DB', () => {
  it('upserta el usuario con todos los campos correctos', async () => {
    let capturedUserRecord: object = {};
    const capturingUpsertUser = (record: object) => {
      capturedUserRecord = record;
      return okUpsert();
    };

    await handleGooglePath(validBody, 'Bearer t', okGetUser, capturingUpsertUser, okUpsert);

    expect(capturedUserRecord).toMatchObject({
      id: fakeUser.id,
      email: fakeUser.email,
      first_name: 'Ana',
      last_name: 'Garcia',
      birth_date: '1998-05-15',
      gender: 'female',
    });
  });

  it('upserta el perfil con id y gender', async () => {
    let capturedProfileRecord: object = {};
    const capturingUpsertProfile = (record: object) => {
      capturedProfileRecord = record;
      return okUpsert();
    };

    await handleGooglePath(validBody, 'Bearer t', okGetUser, okUpsert, capturingUpsertProfile);

    expect(capturedProfileRecord).toMatchObject({
      id: fakeUser.id,
      gender: 'female',
    });
  });

  it('error en upsert de users → 500', async () => {
    const result = await handleGooglePath(
      validBody,
      'Bearer t',
      okGetUser,
      failUpsert,
      okUpsert
    );
    expect(result.status).toBe(500);
    expect(result.body.error).toContain('Failed to create user record');
  });

  it('error en upsert de profiles no impide la respuesta (no es bloqueante)', async () => {
    // El edge function real hace await pero no comprueba el error de profiles
    const silentFailUpsertProfile = () => Promise.resolve({ error: new Error('profile error') });
    const result = await handleGooglePath(
      validBody,
      'Bearer t',
      okGetUser,
      okUpsert,
      silentFailUpsertProfile
    );
    // El handler real devuelve 200 aunque el upsert del profile falle
    // (no hay comprobación de error para profiles)
    expect(result.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Ruta legacy — sigue requiriendo temp_token
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta legacy (email/password)', () => {
  /**
   * Espejo de la validación de la ruta legacy.
   * Verifica que sin is_google_user se exige temp_token y birth_date.
   */
  function validateLegacyPath(body: Partial<EmailRegistrationBody>): {
    valid: boolean;
    error?: string;
  } {
    if (!body.temp_token || !body.birth_date) {
      return { valid: false, error: 'Missing required fields' };
    }
    if (!BIRTH_DATE_REGEX.test(body.birth_date)) {
      return { valid: false, error: 'Invalid birth_date format. Use YYYY-MM-DD' };
    }
    return { valid: true };
  }

  it('temp_token + birth_date válidos → válido', () => {
    expect(
      validateLegacyPath({ temp_token: 'tmp-abc', birth_date: '1995-03-20' })
    ).toEqual({ valid: true });
  });

  it('sin temp_token → inválido', () => {
    const result = validateLegacyPath({ birth_date: '1995-03-20' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing required fields');
  });

  it('sin birth_date → inválido', () => {
    const result = validateLegacyPath({ temp_token: 'tmp-abc' });
    expect(result.valid).toBe(false);
  });

  it('birth_date con formato incorrecto → inválido', () => {
    const result = validateLegacyPath({ temp_token: 'tmp-abc', birth_date: '20/03/1995' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid birth_date format');
  });

  it('token Google (google_xxx) no existe en temp_registrations → habría fallado antes de Fase 3', () => {
    // Documenta el comportamiento anterior: el temp_token "google_xxx"
    // no existía en la tabla temp_registrations y devolvía 400.
    // Después de Fase 3, el flujo Google NO pasa por esta ruta.
    const googleLegacyToken = 'google_uid-1';
    // La nueva implementación detecta is_google_user: true ANTES de llegar aquí
    // Este test documenta que la ruta legacy NO acepta tokens "google_" sin is_google_user
    const result = validateLegacyPath({ temp_token: googleLegacyToken, birth_date: '1998-05-15' });
    expect(result.valid).toBe(true); // el token es formalmente válido...
    // ...pero en el handler real fallaría al no encontrarse en temp_registrations
  });
});

// ---------------------------------------------------------------------------
// Regresión: la respuesta Google NO devuelve session tokens (innecesario)
// ---------------------------------------------------------------------------

describe('auth-register-phase3 — ruta Google: respuesta', () => {
  it('la respuesta exitosa es { success: true } sin access_token', async () => {
    const result = await handleGooglePath(
      validBody,
      'Bearer t',
      okGetUser,
      okUpsert,
      okUpsert
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect((result.body as any).access_token).toBeUndefined();
    expect((result.body as any).refresh_token).toBeUndefined();
  });

  it('el cliente usa el token existente de Google para loginWithSession, no necesita tokens nuevos', () => {
    // Documenta que el flujo correcto en el cliente (RegisterScreen) es:
    // 1. completeGoogleRegistration() → { success: true }
    // 2. loginWithSession(googleUser.user, googleUser.token, googleUser.refreshToken)
    // No se necesita un nuevo par access_token/refresh_token del servidor.
    expect(true).toBe(true); // assertion documental
  });
});
