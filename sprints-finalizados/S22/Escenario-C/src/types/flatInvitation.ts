export interface FlatInvitationCode {
  id: string;
  room_id: string;
  code: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  remaining_uses: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface FlatInvitationValidation {
  code: string;
  room_id: string;
  flat_id: string;
  owner_id: string;
  expires_at: string;
  remaining_uses: number;
}
