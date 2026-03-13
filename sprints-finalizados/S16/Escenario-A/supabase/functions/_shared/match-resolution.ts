export type MatchStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'room_offer'
  | 'room_assigned'
  | 'room_declined';

export type MatchLikeAction =
  | 'create_pending'
  | 'accept_inverse_pending'
  | 'return_existing'
  | 'return_existing_accepted';

type MatchRecord = {
  status?: string | null;
};

function isAcceptedLikeStatus(status?: string | null): boolean {
  return (
    status === 'accepted' ||
    status === 'room_offer' ||
    status === 'room_assigned' ||
    status === 'room_declined'
  );
}

export function resolveLikeAction(
  forwardMatch: MatchRecord | null,
  inverseMatch: MatchRecord | null
): MatchLikeAction {
  if (
    isAcceptedLikeStatus(forwardMatch?.status) ||
    isAcceptedLikeStatus(inverseMatch?.status)
  ) {
    return 'return_existing_accepted';
  }

  if (inverseMatch?.status === 'pending') {
    return 'accept_inverse_pending';
  }

  if (forwardMatch || inverseMatch) {
    return 'return_existing';
  }

  return 'create_pending';
}
