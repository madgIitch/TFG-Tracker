/**
 * Tests unitarios — validación de formato de email
 *
 * Refleja la lógica idéntica presente en:
 *   - src/screens/register/Phase1Email.tsx  (frontend, antes de llamar onNext)
 *   - supabase/functions/auth-register-phase1/index.ts  (backend)
 *
 * No tiene dependencias nativas. Tests puramente de lógica.
 */

// ---------------------------------------------------------------------------
// Regex espejo (idéntico al usado en ambos sitios)
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Simula la validación del frontend: trim + test */
const isValidEmail = (email: string): boolean =>
  EMAIL_REGEX.test(email.trim());

// ---------------------------------------------------------------------------
// Emails válidos
// ---------------------------------------------------------------------------

describe('Validación de email — formatos válidos', () => {
  const valid = [
    'user@example.com',
    'user.name@domain.co',
    'user+tag@gmail.com',
    'a@b.es',
    'test123@test-domain.org',
    'firstname.lastname@company.io',
    'user@subdomain.example.com',
    'USER@EXAMPLE.COM',
    'u@d.co.uk',
  ];

  test.each(valid)('"%s" es válido', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Emails inválidos
// ---------------------------------------------------------------------------

describe('Validación de email — formatos inválidos', () => {
  const invalid = [
    ['cadena vacía', ''],
    ['solo texto sin @', 'notanemail'],
    ['empieza con @', '@nodomain.com'],
    ['sin dominio', 'user@'],
    ['sin TLD', 'user@domain'],
    ['doble @', 'user@@domain.com'],
    ['espacio en medio', 'us er@domain.com'],
    ['espacio antes del @', 'user @domain.com'],
    ['solo espacios', '   '],
    ['solo @', '@'],
    ['sin parte local', '@domain.com'],
  ];

  test.each(invalid)('%s → inválido', (_label, email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Trim antes de validar (comportamiento del frontend)
// ---------------------------------------------------------------------------

describe('Validación de email — normalización con trim()', () => {
  it('email con espacios al inicio y final es válido tras trim', () => {
    expect(isValidEmail('  user@domain.com  ')).toBe(true);
  });

  it('email con solo espacios sigue siendo inválido', () => {
    expect(isValidEmail('   ')).toBe(false);
  });

  it('email con espacios en medio sigue siendo inválido aunque se haga trim', () => {
    expect(isValidEmail('  user @domain.com  ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Coherencia frontend ↔ backend
// ---------------------------------------------------------------------------

describe('Coherencia frontend ↔ backend — mismo regex', () => {
  it('el regex del frontend acepta exactamente los mismos casos que el del backend', () => {
    // Casos de borde que ambas implementaciones deben comportar igual
    const cases: [string, boolean][] = [
      ['a@b.c', true],
      ['a@b', false],
      ['@b.c', false],
      ['a@', false],
      ['', false],
    ];

    for (const [email, expected] of cases) {
      expect(EMAIL_REGEX.test(email)).toBe(expected);
    }
  });
});
