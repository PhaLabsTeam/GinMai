// iOS 27 terminates apps at launch unless they adopt the UIScene lifecycle.
// Expo SDK 57 ships ExpoAppSceneDelegate for this, but the prebuild template
// still creates the window in AppDelegate. This plugin wires the scene delegate
// in on every prebuild. Remove it once the Expo template adopts scenes itself.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const SCENE_DELEGATE_CLASS = 'EXExpoAppSceneDelegate';

const LEGACY_WINDOW_BLOCK =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    }
    let src = config.modResults.contents;
    if (src.includes('ExpoReactNativeFactoryProvider')) {
      return config;
    }

    const classDecl = 'class AppDelegate: ExpoAppDelegate {';
    if (!src.includes(classDecl) || !LEGACY_WINDOW_BLOCK.test(src)) {
      throw new Error(
        'withSceneLifecycle: AppDelegate.swift no longer matches the expected template. ' +
          'Check whether the Expo template now adopts UIScene and this plugin can be removed.'
      );
    }

    // The scene delegate creates the window and starts React Native, so the
    // app delegate only needs to create the factory and expose it.
    src = src.replace(classDecl, 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    src = src.replace(LEGACY_WINDOW_BLOCK, '');
    config.modResults.contents = src;
    return config;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: SCENE_DELEGATE_CLASS,
          },
        ],
      },
    };
    return config;
  });
}

module.exports = function withSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
