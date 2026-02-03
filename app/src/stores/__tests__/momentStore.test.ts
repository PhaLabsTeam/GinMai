import { renderHook, act } from '@testing-library/react-native';
import { useMomentStore } from '../momentStore';
import type { MomentLocal } from '../../types';

describe('momentStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useMomentStore());
    act(() => {
      result.current.clearMoments();
      result.current.clearUserConnections();
    });
  });

  describe('moment CRUD operations', () => {
    it('should add a moment to the store', () => {
      const { result } = renderHook(() => useMomentStore());

      const mockMoment: MomentLocal = {
        id: 'test-moment-1',
        host_id: 'user-1',
        host_name: 'Test User',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853, place_name: 'Test Cafe' },
        seats_total: 2,
        seats_taken: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      act(() => {
        result.current.addMoment(mockMoment);
      });

      expect(result.current.moments).toHaveLength(1);
      expect(result.current.moments[0].id).toBe('test-moment-1');
      expect(result.current.moments[0].host_name).toBe('Test User');
    });

    it('should update an existing moment', () => {
      const { result } = renderHook(() => useMomentStore());

      const mockMoment: MomentLocal = {
        id: 'test-moment-1',
        host_id: 'user-1',
        host_name: 'Test User',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853 },
        seats_total: 2,
        seats_taken: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      act(() => {
        result.current.addMoment(mockMoment);
      });

      act(() => {
        result.current.updateMoment('test-moment-1', { seats_taken: 1 });
      });

      expect(result.current.moments[0].seats_taken).toBe(1);
    });

    it('should remove a moment from the store', () => {
      const { result } = renderHook(() => useMomentStore());

      const mockMoment: MomentLocal = {
        id: 'test-moment-1',
        host_id: 'user-1',
        host_name: 'Test User',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853 },
        seats_total: 2,
        seats_taken: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      act(() => {
        result.current.addMoment(mockMoment);
      });

      expect(result.current.moments).toHaveLength(1);

      act(() => {
        result.current.removeMoment('test-moment-1');
      });

      expect(result.current.moments).toHaveLength(0);
    });

    it('should mark moment as full when seats_taken equals seats_total', () => {
      const { result } = renderHook(() => useMomentStore());

      const mockMoment: MomentLocal = {
        id: 'test-moment-1',
        host_id: 'user-1',
        host_name: 'Test User',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853 },
        seats_total: 2,
        seats_taken: 2,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      act(() => {
        result.current.addMoment(mockMoment);
      });

      const moment = result.current.moments[0];
      const isFull = moment.seats_taken >= moment.seats_total;

      expect(isFull).toBe(true);
    });

    it('should clear all moments', () => {
      const { result } = renderHook(() => useMomentStore());

      const mockMoment1: MomentLocal = {
        id: 'test-moment-1',
        host_id: 'user-1',
        host_name: 'Test User 1',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853 },
        seats_total: 2,
        seats_taken: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      const mockMoment2: MomentLocal = {
        id: 'test-moment-2',
        host_id: 'user-2',
        host_name: 'Test User 2',
        starts_at: new Date().toISOString(),
        duration: 'quick',
        location: { lat: 18.7900, lng: 98.9900 },
        seats_total: 3,
        seats_taken: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1800000).toISOString(),
      };

      act(() => {
        result.current.addMoment(mockMoment1);
        result.current.addMoment(mockMoment2);
      });

      expect(result.current.moments).toHaveLength(2);

      act(() => {
        result.current.clearMoments();
      });

      expect(result.current.moments).toHaveLength(0);
    });
  });

  describe('user moment tracking', () => {
    it('should track user joined moments', () => {
      const { result } = renderHook(() => useMomentStore());

      // Manually set user connections for testing
      act(() => {
        result.current.userConnections = [
          { momentId: 'moment-1', status: 'confirmed', joinedAt: new Date().toISOString() },
          { momentId: 'moment-2', status: 'confirmed', joinedAt: new Date().toISOString() },
        ];
      });

      expect(result.current.hasJoinedMoment('moment-1')).toBe(true);
      expect(result.current.hasJoinedMoment('moment-2')).toBe(true);
      expect(result.current.hasJoinedMoment('moment-3')).toBe(false);
    });

    it('should not track cancelled connections as joined', () => {
      const { result } = renderHook(() => useMomentStore());

      act(() => {
        result.current.userConnections = [
          { momentId: 'moment-1', status: 'cancelled', joinedAt: new Date().toISOString() },
        ];
      });

      expect(result.current.hasJoinedMoment('moment-1')).toBe(false);
    });
  });

  describe('moment filtering', () => {
    it('should handle multiple moments with different statuses', () => {
      const { result } = renderHook(() => useMomentStore());

      const activeMoment: MomentLocal = {
        id: 'active-moment',
        host_id: 'user-1',
        host_name: 'Active User',
        starts_at: new Date().toISOString(),
        duration: 'normal',
        location: { lat: 18.7883, lng: 98.9853 },
        seats_total: 2,
        seats_taken: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };

      const completedMoment: MomentLocal = {
        id: 'completed-moment',
        host_id: 'user-2',
        host_name: 'Completed User',
        starts_at: new Date(Date.now() - 7200000).toISOString(),
        duration: 'normal',
        location: { lat: 18.7900, lng: 98.9900 },
        seats_total: 2,
        seats_taken: 2,
        status: 'completed',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        expires_at: new Date(Date.now() - 3600000).toISOString(),
      };

      act(() => {
        result.current.addMoment(activeMoment);
        result.current.addMoment(completedMoment);
      });

      expect(result.current.moments).toHaveLength(2);

      const activeMoments = result.current.moments.filter((m) => m.status === 'active');
      const completedMoments = result.current.moments.filter((m) => m.status === 'completed');

      expect(activeMoments).toHaveLength(1);
      expect(completedMoments).toHaveLength(1);
    });
  });
});
