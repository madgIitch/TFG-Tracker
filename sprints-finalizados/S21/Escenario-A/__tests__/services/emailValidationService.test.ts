import { validateEmailForRegistration } from '../../src/services/emailValidationService';

describe('emailValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns invalid_format for malformed emails', async () => {
    const result = await validateEmailForRegistration('bad-email');

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('invalid_format');
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts domain when MX exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ data: '10 mx.test.com' }] }),
    });

    const result = await validateEmailForRegistration('user@test.com');

    expect(result.valid).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('accepts domain when MX misses but A exists', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Status: 3, Answer: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Status: 0, Answer: [{ data: '1.1.1.1' }] }),
      });

    const result = await validateEmailForRegistration('user@test.com');

    expect(result.valid).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns invalid_domain when neither MX nor A exist', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Status: 3, Answer: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Status: 3, Answer: [] }),
      });

    const result = await validateEmailForRegistration('user@invalid-domain.tld');

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('invalid_domain');
    }
  });

  it('returns dns_unreachable when DNS queries fail', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'));

    const result = await validateEmailForRegistration('user@test.com');

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('dns_unreachable');
    }
  });
});
