import { resolveLikeAction } from '../../supabase/functions/_shared/match-resolution';

describe('match mutual-like resolution', () => {
  it('A -> B with no existing records creates pending', () => {
    expect(resolveLikeAction(null, null)).toBe('create_pending');
  });

  it('B -> A accepts inverse pending instead of creating duplicate', () => {
    expect(
      resolveLikeAction(
        null,
        { status: 'pending' }
      )
    ).toBe('accept_inverse_pending');
  });

  it('returns idempotent accepted when pair is already accepted', () => {
    expect(
      resolveLikeAction(
        { status: 'accepted' },
        null
      )
    ).toBe('return_existing_accepted');
  });

  it('returns existing pending when same user likes twice before reciprocal like', () => {
    expect(
      resolveLikeAction(
        { status: 'pending' },
        null
      )
    ).toBe('return_existing');
  });

  it('never creates mirror record when inverse exists in rejected state', () => {
    expect(
      resolveLikeAction(
        null,
        { status: 'rejected' }
      )
    ).toBe('return_existing');
  });
});
