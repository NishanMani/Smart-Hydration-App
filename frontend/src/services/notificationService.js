import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Device = null;
let Notifications = null;
let Constants = null;

try {
  Constants = require("expo-constants").default;
} catch (error) {
  // Expo constants are optional at runtime.
}

const PUSH_TOKEN_KEY = "devicePushToken";
const EXPO_PUSH_TOKEN_KEY = "expoPushToken";

let isNotificationHandlerReady = false;

const detectExpoGo = () => {
  const executionEnvironment = Constants?.executionEnvironment;
  if (executionEnvironment === "storeClient") {
    return true;
  }

  return Constants?.appOwnership === "expo";
};
const isExpoGoRuntime = detectExpoGo();

if (!isExpoGoRuntime) {
  try {
    Device = require("expo-device");
    Notifications = require("expo-notifications");
  } catch (error) {
    // Notification modules are optional at runtime until dependencies are installed.
  }
}

const isExpoGo = () => isExpoGoRuntime;

const requestNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

export const initializeNotifications = async () => {
  if (!Notifications) return;
  if (isExpoGo()) return;
  if (isNotificationHandlerReady) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  isNotificationHandlerReady = true;
};

export const getPushTokenForBackend = async () => {
  if (!Notifications || !Device) {
    return null;
  }
  if (isExpoGo()) {
    return null;
  }

  if (Platform.OS !== "android") {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  try {
    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenResult?.data === "string" ? tokenResult.data : null;

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

export const getExpoPushTokenForTesting = async () => {
  if (!Notifications || !Device) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenResult = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = typeof tokenResult?.data === "string" ? tokenResult.data : null;

    if (token) {
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
      return token;
    }
  } catch (error) {
    // Ignore token fetch errors and fallback to cached token.
  }

  return AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
};
