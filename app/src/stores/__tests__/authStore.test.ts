import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';
import type { User } from '../../types';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.user = null;
      result.current.session = null;
    });
  });

  describe('DEV_MODE authentication', () => {
    it('should create mock user in DEV_MODE', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: User = {
        id: 'dev-user-id',
        phone: '+66812345678',
        first_name: 'Dev User',
        verified: true,
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.user = mockUser;
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.first_name).toBe('Dev User');
      expect(result.current.user?.phone).toBe('+66812345678');
    });

    it('should handle user with verification badge', () => {
      const { result } = renderHook(() => useAuthStore());

      const verifiedUser: User = {
        id: 'user-1',
        phone: '+66812345678',
        first_name: 'Verified User',
        verified: true,
        meals_hosted: 5,
        meals_joined: 10,
        no_shows: 0,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.user = verifiedUser;
      });

      expect(result.current.user?.verified).toBe(true);
      expect(result.current.user?.meals_hosted).toBe(5);
      expect(result.current.user?.meals_joined).toBe(10);
    });

    it('should handle unverified user', () => {
      const { result } = renderHook(() => useAuthStore());

      const unverifiedUser: User = {
        id: 'user-2',
        phone: '+66823456789',
        first_name: 'New User',
        verified: false,
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.user = unverifiedUser;
      });

      expect(result.current.user?.verified).toBe(false);
      expect(result.current.user?.meals_hosted).toBe(0);
    });
  });

  describe('authentication state', () => {
    it('should track user session', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        } as any;
      });

      expect(result.current.session).toBeTruthy();
      expect(result.current.session?.access_token).toBe('mock-token');
    });

    it('should clear user on sign out', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser: User = {
        id: 'user-1',
        phone: '+66812345678',
        first_name: 'Test',
        verified: true,
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        created_at: new Date().toISOString(),
      };

      // Set user first
      act(() => {
        result.current.user = mockUser;
        result.current.session = {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
        } as any;
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.session).toBeTruthy();

      // Sign out
      act(() => {
        result.current.user = null;
        result.current.session = null;
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should handle authentication state transitions', () => {
      const { result } = renderHook(() => useAuthStore());

      // Start unauthenticated
      expect(result.current.user).toBeNull();

      // Sign in
      act(() => {
        result.current.user = {
          id: 'user-1',
          phone: '+66812345678',
          first_name: 'Test',
          verified: false,
          meals_hosted: 0,
          meals_joined: 0,
          no_shows: 0,
          created_at: new Date().toISOString(),
        };
      });

      expect(result.current.user).toBeTruthy();

      // Update verification status
      act(() => {
        if (result.current.user) {
          result.current.user = {
            ...result.current.user,
            verified: true,
          };
        }
      });

      expect(result.current.user?.verified).toBe(true);

      // Sign out
      act(() => {
        result.current.user = null;
        result.current.session = null;
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('user stats', () => {
    it('should track meal statistics', () => {
      const { result } = renderHook(() => useAuthStore());

      const userWithStats: User = {
        id: 'user-1',
        phone: '+66812345678',
        first_name: 'Active User',
        verified: true,
        meals_hosted: 15,
        meals_joined: 25,
        no_shows: 1,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.user = userWithStats;
      });

      expect(result.current.user?.meals_hosted).toBe(15);
      expect(result.current.user?.meals_joined).toBe(25);
      expect(result.current.user?.no_shows).toBe(1);
    });

    it('should handle users with no activity', () => {
      const { result } = renderHook(() => useAuthStore());

      const newUser: User = {
        id: 'user-2',
        phone: '+66823456789',
        first_name: 'Brand New',
        verified: false,
        meals_hosted: 0,
        meals_joined: 0,
        no_shows: 0,
        created_at: new Date().toISOString(),
      };

      act(() => {
        result.current.user = newUser;
      });

      expect(result.current.user?.meals_hosted).toBe(0);
      expect(result.current.user?.meals_joined).toBe(0);
      expect(result.current.user?.no_shows).toBe(0);
    });
  });
});
