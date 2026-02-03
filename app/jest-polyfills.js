// Polyfills for Jest environment

// Mock structuredClone if not available
if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Setup Expo global registry
if (!global.__ExpoImportMetaRegistry) {
  global.__ExpoImportMetaRegistry = new Map();
}
