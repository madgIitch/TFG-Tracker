const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('roomAssignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue('token-1');
  });

  it('createAssignment sends match_id flow payload (seeker)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'a1',
          room_id: 'r1',
          match_id: 'm1',
          assignee_id: 'u2',
          status: 'offered',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    });

    const { roomAssignmentService } = require('../../src/services/roomAssignmentService');
    const assignment = await roomAssignmentService.createAssignment({
      match_id: 'm1',
      room_id: 'r1',
      assignee_id: 'u2',
    });

    expect(assignment.match_id).toBe('m1');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"match_id":"m1"');
  });

  it('createAssignment supports owner/self-assignment payload without match_id', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'a2',
          room_id: 'r2',
          assignee_id: 'owner1',
          status: 'offered',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    });

    const { roomAssignmentService } = require('../../src/services/roomAssignmentService');
    await roomAssignmentService.createAssignment({
      room_id: 'r2',
      assignee_id: 'owner1',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"room_id":"r2"');
    expect(init.body).toContain('"assignee_id":"owner1"');
  });

  it('updateAssignment accepts valid statuses and maps response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'a1',
          room_id: 'r1',
          match_id: 'm1',
          assignee_id: 'u2',
          status: 'accepted',
          created_at: '2026-01-01',
          updated_at: '2026-01-02',
        },
      }),
    });

    const { roomAssignmentService } = require('../../src/services/roomAssignmentService');
    const result = await roomAssignmentService.updateAssignment({
      assignment_id: 'a1',
      status: 'accepted',
    });

    expect(result.status).toBe('accepted');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(init.body).toContain('"status":"accepted"');
  });

  it('throws backend message when assignment update fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'room not available',
    });

    const { roomAssignmentService } = require('../../src/services/roomAssignmentService');

    await expect(
      roomAssignmentService.updateAssignment({
        assignment_id: 'a1',
        status: 'rejected',
      })
    ).rejects.toThrow('room not available');
  });
});
