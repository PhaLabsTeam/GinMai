module.exports = async () => {
  // Setup global Expo mocks
  global.__DEV__ = true;

  // Mock __ExpoImportMetaRegistry
  if (!global.__ExpoImportMetaRegistry) {
    global.__ExpoImportMetaRegistry = new Map();
  }
};
