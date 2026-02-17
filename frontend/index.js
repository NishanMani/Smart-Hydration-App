import { registerRootComponent } from 'expo';
import { NativeModules } from "react-native";
import Constants from "expo-constants";

import App from './App';

if (
  Constants.executionEnvironment !== "storeClient" &&
  NativeModules?.RNFBAppModule
) {
  try {
    const messaging = require("@react-native-firebase/messaging").default;
    messaging().setBackgroundMessageHandler(async () => {});
  } catch (error) {
    // RN Firebase modules are unavailable when native build is missing.
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
