import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OverrideService } from '../services/overrideService';
import type { TeacherOverride } from '../types';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'mocked_id' }, error: null }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ 
      data: [
        { id: '1', status: 'active', expires_at: new Date(Date.now() + 100000).toISOString() },
        { id: '2', status: 'active', expires_at: new Date(Date.now() - 100000).toISOString() } // expired
      ], 
      error: null 
    }),
  }
}));

describe('OverrideService', () => {
  let service: OverrideService;

  beforeEach(() => {
    service = new OverrideService();
    vi.clearAllMocks();
  });

  it('throws an error if reason is too short', async () => {
    const override: TeacherOverride = {
      student_id: 's1',
      classroom_id: 'c1',
      original_action: 'REMEDIATE_PREREQUISITE',
      original_concept: 'c_loop',
      override_action: 'ADVANCE',
      override_concept: 'c_func',
      reason: 'ok', // too short
      created_by: 't1'
    };

    await expect(service.submitOverride(override)).rejects.toThrow('detailed reason must be provided');
  });

  it('filters out expired active overrides', async () => {
    const overrides = await service.getActiveOverrides('s1', 'c1');
    expect(overrides.length).toBe(1);
    expect(overrides[0].id).toBe('1');
  });
});
