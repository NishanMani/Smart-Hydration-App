import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let Device = null;
let Notifications = null;
let Constants = null;
let FirebaseMessaging = null;

try {
  Constants = require("expo-constants").default;
} catch (error) {
  // Expo constants are optional at runtime.
}

const PUSH_TOKEN_KEY = "devicePushToken";
const EXPO_PUSH_TOKEN_KEY = "expoPushToken";
const LOCAL_REMINDER_NOTIFICATION_IDS_KEY = "localReminderNotificationIds";

let isNotificationHandlerReady = false;

try {
  Device = require("expo-device");
  Notifications = require("expo-notifications");
} catch (error) {
  // Notification modules are optional at runtime until dependencies are installed.
}

try {
  FirebaseMessaging = require("@react-native-firebase/messaging").default;
} catch (error) {
  // Firebase messaging is optional until native dependency is installed/configured.
}

const requestNotificationPermission = async () => {
  if (!Notifications) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

export const ensureNotificationPermission = async () => {
  const granted = await requestNotificationPermission();
  console.log("[Notifications] Permission granted:", granted);
  return granted;
};

export const initializeNotifications = async () => {
  if (!Notifications) return;
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
  if (Platform.OS !== "android") {
    console.log("[Notifications] Push token skipped: platform is not Android.");
    return null;
  }

  if (Notifications) {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log("[Notifications] Push token skipped: notification permission not granted.");
      return null;
    }
  }

  if (Device && !Device.isDevice) {
    console.log("[Notifications] Push token skipped: running on emulator/simulator.");
    return null;
  }

  try {
    let token = null;

    if (FirebaseMessaging) {
      const firebaseToken = await FirebaseMessaging().getToken();
      if (typeof firebaseToken === "string" && firebaseToken.length > 0) {
        token = firebaseToken;
        console.log("[Notifications] Push token received from Firebase:", token);
      }
    }

    if (!token && Notifications) {
      const tokenResult = await Notifications.getDevicePushTokenAsync();
      const deviceToken =
        typeof tokenResult?.data === "string" ? tokenResult.data : null;
      const tokenType = String(tokenResult?.type || "").toLowerCase();

      if (deviceToken && (!tokenType || tokenType === "fcm")) {
        token = deviceToken;
        console.log("[Notifications] Push token received from device API:", token);
      }
    }

    // Fallback for Expo runtime/dev workflows where FCM token may be unavailable.
    if (!token && Notifications) {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;
      const expoTokenResult = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      const expoToken =
        typeof expoTokenResult?.data === "string" ? expoTokenResult.data : null;

      if (expoToken) {
        token = expoToken;
        console.log("[Notifications] Expo push token fallback received:", token);
      }
    }

    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      console.log("[Notifications] Push token cached for backend use.");
      return token;
    }
  } catch (error) {
    console.log("[Notifications] Push token fetch failed:", error);
    // Ignore token fetch errors and fallback to cached token.
  }

  const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (cachedToken) {
    console.log("[Notifications] Using cached push token for backend:", cachedToken);
  } else {
    console.log("[Notifications] No push token available (fresh or cached).");
  }

  return cachedToken;
};

export const getCachedPushToken = async () => {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
};

const parseHHmmToMinutes = (value, fallback) => {
  const [h, m] = String(value || fallback).split(":").map(Number);
  const hour = Number.isFinite(h) ? h : Number(fallback.split(":")[0]);
  const minute = Number.isFinite(m) ? m : Number(fallback.split(":")[1]);
  return hour * 60 + minute;
};

const isWithinSleepWindow = (valueMinutes, startMinutes, endMinutes) => {
  if (startMinutes === endMinutes) return false;
  if (startMinutes > endMinutes) {
    return valueMinutes >= startMinutes || valueMinutes < endMinutes;
  }
  return valueMinutes >= startMinutes && valueMinutes < endMinutes;
};

const cancelLocalReminderNotifications = async () => {
  if (!Notifications) return;

  try {
    const rawIds = await AsyncStorage.getItem(LOCAL_REMINDER_NOTIFICATION_IDS_KEY);
    const ids = rawIds ? JSON.parse(rawIds) : [];

    if (Array.isArray(ids) && ids.length > 0) {
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
      );
    }
    await AsyncStorage.removeItem(LOCAL_REMINDER_NOTIFICATION_IDS_KEY);
  } catch (error) {
    console.log("[Notifications] Failed to cancel local reminder notifications:", error);
  }
};

export const syncLocalReminderNotifications = async ({
  enabled,
  paused,
  intervalMinutes,
  sleepMode,
  sleepStartTime,
  sleepEndTime,
}) => {
  if (!Notifications) return;

  await cancelLocalReminderNotifications();

  if (!enabled || paused || !intervalMinutes) {
    console.log("[Notifications] Local reminders not scheduled (disabled/paused/no interval).");
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log("[Notifications] Local reminders not scheduled (permission denied).");
    return;
  }

  const sleepStartMinutes = parseHHmmToMinutes(sleepStartTime, "22:00");
  const sleepEndMinutes = parseHHmmToMinutes(sleepEndTime, "06:00");
  const scheduledIds = [];

  const now = new Date();
  for (let offset = intervalMinutes; offset <= 24 * 60; offset += intervalMinutes) {
    const triggerDate = new Date(now.getTime() + offset * 60000);
    const minuteOfDay = triggerDate.getHours() * 60 + triggerDate.getMinutes();

    if (
      sleepMode &&
      isWithinSleepWindow(minuteOfDay, sleepStartMinutes, sleepEndMinutes)
    ) {
      continue;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hydration Reminder",
        body: "Time to drink water 💧",
        sound: true,
      },
      trigger: triggerDate,
    });
    scheduledIds.push(id);
  }

  await AsyncStorage.setItem(
    LOCAL_REMINDER_NOTIFICATION_IDS_KEY,
    JSON.stringify(scheduledIds)
  );
  console.log("[Notifications] Local reminder notifications scheduled:", scheduledIds.length);
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
