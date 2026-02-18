import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken as getAuthToken } from "./storageService";
import { saveFcmToken } from "../api/reminderApi";

let Device = null;
let Notifications = null;
let messaging = null;
let getTokenFromMessaging = null;
let onTokenRefreshFromMessaging = null;
let requestPermissionFromMessaging = null;
let setBackgroundMessageHandlerFromMessaging = null;

const PUSH_TOKEN_KEY = "devicePushToken";
const LOCAL_REMINDER_NOTIFICATION_IDS_KEY = "localReminderNotificationIds";

let isNotificationHandlerReady = false;

try {
  Device = require("expo-device");
  Notifications = require("expo-notifications");
} catch (error) {
  // Notification modules are optional at runtime until dependencies are installed.
}

try {
  const firebaseAppModule = require("@react-native-firebase/app");
  const firebaseMessagingModule = require("@react-native-firebase/messaging");
  const getApp = firebaseAppModule.getApp;
  const getMessaging = firebaseMessagingModule.getMessaging;
  getTokenFromMessaging = firebaseMessagingModule.getToken;
  onTokenRefreshFromMessaging = firebaseMessagingModule.onTokenRefresh;
  requestPermissionFromMessaging = firebaseMessagingModule.requestPermission;
  setBackgroundMessageHandlerFromMessaging =
    firebaseMessagingModule.setBackgroundMessageHandler;

  if (getApp && getMessaging) {
    messaging = getMessaging(getApp());
  }
} catch (error) {
  // Firebase messaging may be unavailable until native setup is complete.
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

const hasAuthToken = async () => {
  const token = await getAuthToken();
  return Boolean(token);
};

export const requestUserPermission = async () => {
  try {
    if (Platform.OS === "android") {
      if (Number(Platform.Version) < 33) return true;

      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) return true;

      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (Platform.OS === "ios") {
      if (!messaging || !requestPermissionFromMessaging) return false;
      const status = await requestPermissionFromMessaging(messaging);
      return status === 1 || status === 2;
    }

    return true;
  } catch (error) {
    console.log("[Notifications] Permission request error:", error);
    return false;
  }
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
  if (!messaging) {
    console.log("[Notifications] Push token skipped: Firebase messaging not available.");
    return null;
  }

  const hasPermission = await requestUserPermission();
  if (!hasPermission) {
    console.log("[Notifications] Push token skipped: notification permission not granted.");
    return null;
  }

  if (Device && !Device.isDevice) {
    console.log("[Notifications] Running on emulator/simulator. Attempting FCM token anyway.");
  }

  try {
    let token = null;
    if (!getTokenFromMessaging) {
      console.log("[Notifications] Push token skipped: Firebase token API unavailable.");
      return null;
    }
    const firebaseToken = await getTokenFromMessaging(messaging);
    if (typeof firebaseToken === "string" && firebaseToken.length > 0) {
      token = firebaseToken;
      console.log("[Notifications] Push token received from Firebase:", token);
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

export const syncFcmTokenToBackend = async () => {
  try {
    if (!(await hasAuthToken())) return false;

    const hasPermission = await requestUserPermission();
    if (!hasPermission) return false;

    const token = await getPushTokenForBackend();
    if (!token) return false;

    console.log("[Notifications] Syncing push token to backend:", token);
    await saveFcmToken(token);
    return true;
  } catch (error) {
    console.log("[Notifications] FCM sync error:", error);
    return false;
  }
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

if (messaging && setBackgroundMessageHandlerFromMessaging) {
  setBackgroundMessageHandlerFromMessaging(messaging, async (remoteMessage) => {
    console.log("[Notifications] Background message received:", remoteMessage);
  });
}

export const Notification = () => {
  useEffect(() => {
    if (!messaging || !onTokenRefreshFromMessaging) return () => {};

    const unsubscribe = onTokenRefreshFromMessaging(messaging, async (token) => {
      try {
        if (!(await hasAuthToken())) return;
        if (!token) return;

        console.log("[Notifications] Token refreshed:", token);
        await saveFcmToken(token);
      } catch (error) {
        console.log("[Notifications] Token refresh sync failed:", error);
      }
    });

    return unsubscribe;
  }, []);

  return null;
};
