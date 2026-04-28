type EmailValidationErrorCode =
  | 'invalid_format'
  | 'invalid_domain'
  | 'dns_unreachable';

export type EmailValidationResult =
  | { valid: true; normalizedEmail: string }
  | {
      valid: false;
      normalizedEmail: string;
      code: EmailValidationErrorCode;
      message: string;
    };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const DNS_TIMEOUT_MS = 4500;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseDomain = (email: string): string | null => {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  return parts[1]?.trim().toLowerCase() || null;
};

const isValidEmailFormat = (email: string): boolean => EMAIL_REGEX.test(email);

type DnsQueryResult = 'exists' | 'not_found' | 'network_error';

const fetchWithTimeout = async (url: string): Promise<Response> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('timeout'));
      }, DNS_TIMEOUT_MS);
    });

    const response = (await Promise.race([fetch(url), timeoutPromise])) as Response;
    return response;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const queryDnsRecord = async (domain: string, type: 'MX' | 'A'): Promise<DnsQueryResult> => {
  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return 'network_error';
    }

    const payload = (await response.json()) as {
      Status?: number;
      Answer?: Array<unknown>;
    };

    if (Array.isArray(payload.Answer) && payload.Answer.length > 0) {
      return 'exists';
    }

    if (typeof payload.Status === 'number') {
      if (payload.Status === 0 || payload.Status === 3) {
        return 'not_found';
      }
    }

    return 'not_found';
  } catch {
    return 'network_error';
  }
};

export const validateEmailForRegistration = async (
  email: string
): Promise<EmailValidationResult> => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail,
      code: 'invalid_format',
      message: 'Introduce un email con formato valido.',
    };
  }

  const domain = parseDomain(normalizedEmail);
  if (!domain) {
    return {
      valid: false,
      normalizedEmail,
      code: 'invalid_format',
      message: 'Introduce un email con formato valido.',
    };
  }

  const mxResult = await queryDnsRecord(domain, 'MX');
  if (mxResult === 'exists') {
    return { valid: true, normalizedEmail };
  }

  const aResult = await queryDnsRecord(domain, 'A');
  if (aResult === 'exists') {
    return { valid: true, normalizedEmail };
  }

  const hadNetworkError = mxResult === 'network_error' || aResult === 'network_error';
  if (hadNetworkError) {
    return {
      valid: false,
      normalizedEmail,
      code: 'dns_unreachable',
      message: 'No se pudo verificar el dominio del email. Intentalo de nuevo.',
    };
  }

  return {
    valid: false,
    normalizedEmail,
    code: 'invalid_domain',
    message: 'El dominio del email no existe o no acepta correo.',
  };
};
