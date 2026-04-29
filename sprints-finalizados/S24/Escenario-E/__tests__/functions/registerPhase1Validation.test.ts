/**
 * Tests de integración — lógica de validación de auth-register-phase1
 *
 * La Edge Function usa Deno y no puede importarse directamente en Jest.
 * Se extrae la lógica de validación inline (mismo patrón que
 * countActiveFilters.test.ts y matchesFlow.test.ts).
 *
 * Cubre:
 *   1. Email vacío → 400
 *   2. Formato de email inválido → 400 (sin llamar a DNS)
 *   3. Dominio inexistente (NXDOMAIN, Status=3) → 400
 *   4. Dominio válido con MX → pasa la validación
 *   5. Dominio sin MX pero existente (Status=0 sin Answer) → pasa igualmente
 *   6. Error de red en DNS → fail-open (deja pasar)
 *   7. La petición DNS se hace al dominio correcto con type=MX
 */

// ---------------------------------------------------------------------------
// Lógica de validación extraída de auth-register-phase1/index.ts
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ValidationResult {
  valid: boolean;
  status: number;
  error?: string;
}

async function validateRegistrationEmail(email: string): Promise<ValidationResult> {
  if (!email) {
    return { valid: false, status: 400, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, status: 400, error: 'Invalid email format' };
  }

  const domain = email.split('@')[1];
  try {
    const dnsRes = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } }
    );
    const dnsData = await (dnsRes as Response).json();
    if (dnsData.Status === 3) {
      return { valid: false, status: 400, error: 'El dominio del email no existe' };
    }
  } catch {
    // Error de red → dejar pasar para no bloquear usuarios válidos
  }

  return { valid: true, status: 201 };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registerPhase1 — validación de email vacío y formato', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('email vacío → 400 "Email is required" sin llamar a DNS', async () => {
    const result = await validateRegistrationEmail('');

    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('Email is required');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('formato inválido — sin @ → 400 "Invalid email format" sin llamar a DNS', async () => {
    const result = await validateRegistrationEmail('notanemail');

    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('Invalid email format');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('formato inválido — sin TLD → 400 sin llamar a DNS', async () => {
    const result = await validateRegistrationEmail('user@domain');

    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('formato inválido — solo @ → 400 sin llamar a DNS', async () => {
    const result = await validateRegistrationEmail('@');

    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('registerPhase1 — DNS domain check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('NXDOMAIN (Status=3) → 400 "El dominio del email no existe"', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 3 }),
    });

    const result = await validateRegistrationEmail('user@nonexistent-xyz-99999.com');

    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('El dominio del email no existe');
  });

  it('dominio válido con MX (Status=0) → pasa la validación', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        Status: 0,
        Answer: [{ type: 15, data: '10 mail.example.com.' }],
      }),
    });

    const result = await validateRegistrationEmail('user@example.com');

    expect(result.valid).toBe(true);
    expect(result.status).toBe(201);
  });

  it('dominio sin MX pero existente (Status=0 sin Answer) → pasa igualmente', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 0 }),
    });

    const result = await validateRegistrationEmail('user@a-record-only-domain.com');

    expect(result.valid).toBe(true);
    expect(result.status).toBe(201);
  });

  it('error de red en DNS → fail-open, deja pasar la validación', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network timeout'));

    const result = await validateRegistrationEmail('user@gmail.com');

    expect(result.valid).toBe(true);
    expect(result.status).toBe(201);
  });

  it('hace la petición a dns.google con el dominio y type=MX correctos', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 0 }),
    });

    await validateRegistrationEmail('test@mycustom-domain.org');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('dns.google/resolve');
    expect(url).toContain('mycustom-domain.org');
    expect(url).toContain('type=MX');
    expect(options.headers.Accept).toBe('application/dns-json');
  });

  it('dominio con caracteres especiales se encoda correctamente en la URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 0 }),
    });

    await validateRegistrationEmail('user@sub.example-domain.co.uk');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    // encodeURIComponent no debe dejar el dominio sin codificar si tiene puntos (los puntos son seguros)
    expect(url).toContain('sub.example-domain.co.uk');
  });
});

describe('registerPhase1 — flujo completo de validación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('email correcto con dominio existente → válido (201)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 0, Answer: [] }),
    });

    const result = await validateRegistrationEmail('pepe@gmail.com');

    expect(result.valid).toBe(true);
    expect(result.status).toBe(201);
    expect(result.error).toBeUndefined();
  });

  it('email de prueba del sistema real (a@a.com) con dominio existente → válido', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ Status: 0 }),
    });

    // Email del usuario de ejemplo en los datos del sprint
    const result = await validateRegistrationEmail('a@a.com');

    expect(result.valid).toBe(true);
  });
});
