const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Backend hotfix regression checks', () => {
  test('auth-register enforces and persists gender', () => {
    const content = read('supabase/functions/auth-register/index.ts');

    expect(content).toMatch(/birth_date and gender are required/);
    expect(content).toMatch(/validGenders/);
    expect(content).toMatch(/from\('users'\)/);
    expect(content).toMatch(/gender:\s*body\.data\.gender/);
    expect(content).toMatch(/from\('profiles'\)/);
  });

  test('chats protects chat creation and read updates by participant checks', () => {
    const content = read('supabase/functions/chats/index.ts');

    expect(content).toMatch(/CHAT_ENABLED_MATCH_STATUSES/);
    expect(content).toMatch(/async function createChat\(matchId:\s*string,\s*userId:\s*string\)/);
    expect(content).toMatch(/You can only create chats for your own matches/);
    expect(content).toMatch(/await getChatMessages\(chatId,\s*userId\)/);
  });

  test('chats delete uses chat id lookup, not match id lookup', () => {
    const content = read('supabase/functions/chats/index.ts');

    expect(content).toMatch(/if \(method === 'DELETE'\)/);
    expect(content).toMatch(/await getChatById\(chatId,\s*userId\)/);
    expect(content).not.toMatch(/await getChatByMatchId\(chatId,\s*userId\)/);
  });

  test('room-assignments prevents multi-accepted room and rejects competing offers', () => {
    const content = read('supabase/functions/room-assignments/index.ts');

    expect(content).toMatch(/async function rejectOtherOffers/);
    expect(content).toMatch(/hasAcceptedAssignment\(typedExisting\.room_id\)/);
    expect(content).toMatch(/Room already assigned/);
    expect(content).toMatch(/await rejectOtherOffers\(typedExisting\.room_id,\s*assignmentId\)/);
  });

  test('migration enforces one accepted assignment per room', () => {
    const content = read(
      'supabase/migrations/20260315_room_assignments_single_accepted_per_room.sql'
    );

    expect(content).toMatch(/row_number\(\) over/);
    expect(content).toMatch(/where status = 'accepted'/);
    expect(content).toMatch(
      /create unique index if not exists idx_room_assignments_single_accepted_per_room/i
    );
  });

  test('rooms search aligns owner join with users and avoids flat.city count filter', () => {
    const content = read('supabase/functions/rooms/search.ts');

    expect(content).toMatch(/owner:users!rooms_owner_id_fkey/);
    expect(content).toMatch(/getFlatIdsByCity/);
    expect(content).not.toMatch(/countQuery\s*=\s*countQuery\.eq\('flat\.city'/);
  });

  test('interests enriches via explicit profiles lookup (no direct user:profiles join)', () => {
    const content = read('supabase/functions/interests/index.ts');

    expect(content).toMatch(/async function enrichInterestsWithProfiles/);
    expect(content).toMatch(/from\('profiles'\)/);
    expect(content).not.toMatch(/user:profiles/);
  });

  test('rooms owner_id scope is guarded', () => {
    const content = read('supabase/functions/rooms/index.ts');

    expect(content).toMatch(/async function canAccessOwnerInventory/);
    expect(content).toMatch(/Forbidden owner_id scope/);
  });
});
