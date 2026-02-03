// Mock for Expo to bypass Winter bundling system in Jest

module.exports = {
  // Re-export only what's needed for tests
  registerRootComponent: jest.fn(),
};
