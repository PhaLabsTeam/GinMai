// Setup Expo mocks
try {
  require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();
} catch (e) {
  // Reanimated setup not required for these tests
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 18.7883,
        longitude: 98.9853,
        altitude: 0,
        accuracy: 10,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        city: 'Chiang Mai',
        region: 'Chiang Mai',
        country: 'Thailand',
      },
    ])
  ),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock React Native Maps
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Circle: 'Circle',
  PROVIDER_GOOGLE: 'google',
}));

// Mock Supabase
jest.mock('./src/config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      signInWithOtp: jest.fn(() =>
        Promise.resolve({ data: {}, error: null })
      ),
      verifyOtp: jest.fn(() =>
        Promise.resolve({
          data: {
            user: { id: 'test-user-id', phone: '+66812345678' },
            session: { access_token: 'test-token' },
          },
          error: null,
        })
      ),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
  isSupabaseConfigured: () => false,
  DEV_MODE: true,
}));
