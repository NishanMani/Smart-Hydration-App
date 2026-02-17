import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getFirebaseMessaging } from "../firebase";

const PUSH_TOKEN_KEY = "devicePushToken";
let isNotificationHandlerReady = false;
let messagingModule = undefined;
const isExpoGo = Constants.executionEnvironment === "storeClient";
const hasRNFirebaseNative = Boolean(NativeModules?.RNFBAppModule);

const getMessaging = () => {
  if (messagingModule !== undefined) {
    return messagingModule;
  }

  if (isExpoGo || !hasRNFirebaseNative) {
    messagingModule = null;
    return messagingModule;
  }

  messagingModule = getFirebaseMessaging();
  if (!messagingModule) {
    messagingModule = null;
    return messagingModule;
  }

  messagingModule().setAutoInitEnabled(true);

  return messagingModule;
};

const requestAndroidPermission = async () => {
  if (Platform.OS !== "android") return true;
  if (Platform.Version < 33) return true;

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  return status === PermissionsAndroid.RESULTS.GRANTED;
};

export const requestPermission = async () => {
  const messaging = getMessaging();
  if (!messaging) return false;

  const hasAndroidPermission = await requestAndroidPermission();
  if (!hasAndroidPermission) return false;

  try {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    return false;
  }
};

export const initializeNotifications = async () => {
  const messaging = getMessaging();
  if (!messaging) return;
  if (isNotificationHandlerReady) return;

  await messaging().registerDeviceForRemoteMessages().catch(() => null);

  isNotificationHandlerReady = true;
};

export const getPushTokenForBackend = async () => {
  const messaging = getMessaging();
  if (!messaging) {
    return AsyncStorage.getItem(PUSH_TOKEN_KEY);
  }

  const hasPermission = await requestPermission();
  if (!hasPermission) {
    return null;
  }

  try {
    const token = await messaging().getToken();
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      return token;
    }
  } catch (error) {
    // Ignore token fetch errors and fallback to cached token.
  }

  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
};

export const getCachedPushToken = async () => {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
};
