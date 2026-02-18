import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReminder, saveFcmToken, setReminder } from "../api/reminderApi";
import {
  ensureNotificationPermission,
  getPushTokenForBackend,
  syncFcmTokenToBackend,
  syncLocalReminderNotifications,
} from "../services/notificationService";

export default function ReminderScreen() {
  const navigation = useNavigation();

  const [enabled, setEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pauseDurationMinutes, setPauseDurationMinutes] = useState(60);
  const [sleepMode, setSleepMode] = useState(false);
  const [interval, setReminderInterval] = useState("30 minutes");
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState("45");
  const [activityLevel, setActivityLevel] = useState("Moderate");

  const [sleepStartTime, setSleepStartTime] = useState(new Date());
  const [sleepEndTime, setSleepEndTime] = useState(new Date());
  const [showSleepStart, setShowSleepStart] = useState(false);
  const [showSleepEnd, setShowSleepEnd] = useState(false);

  useEffect(() => {
    loadSettings();
    ensureNotificationPermission().catch((error) => {
      console.log("[Reminders] Permission request failed on screen load:", error);
    });
  }, []);

  const intervals = ["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours", "Custom"];

  const intervalMap = {
    "30 minutes": 30,
    "1 hour": 60,
    "1.5 hours": 90,
    "2 hours": 120,
    "3 hours": 180,
  };
  const pauseDurations = [
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
  ];

  const intervalLabelFromMinutes = {
    30: "30 minutes",
    60: "1 hour",
    90: "1.5 hours",
    120: "2 hours",
    180: "3 hours",
  };

  const getIntervalMinutes = () => {
    if (interval === "Custom") {
      const parsed = Number(customIntervalMinutes);
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 30;
    }
    return intervalMap[interval] || 30;
  };

  const getIntervalLabel = () => {
    if (interval === "Custom") {
      const minutes = getIntervalMinutes();
      return `${minutes} minute${minutes === 1 ? "" : "s"}`;
    }
    return interval;
  };

  const onChangeSleepStart = (event, selectedDate) => {
    setShowSleepStart(false);
    if (selectedDate) setSleepStartTime(selectedDate);
  };

  const onChangeSleepEnd = (event, selectedDate) => {
    setShowSleepEnd(false);
    if (selectedDate) setSleepEndTime(selectedDate);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toHHmm = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const fromHHmm = (value) => {
    const [h, m] = String(value || "22:00").split(":").map(Number);
    const date = new Date();
    date.setHours(Number.isFinite(h) ? h : 22, Number.isFinite(m) ? m : 0, 0, 0);
    return date;
  };

  const toMinutes = (date) => date.getHours() * 60 + date.getMinutes();

  const isWithinSleepWindow = (valueMinutes, startMinutes, endMinutes) => {
    if (startMinutes === endMinutes) return false;
    if (startMinutes > endMinutes) {
      return valueMinutes >= startMinutes || valueMinutes < endMinutes;
    }
    return valueMinutes >= startMinutes && valueMinutes < endMinutes;
  };

  const formatMinutesToTime = (minutes) => {
    const date = new Date();
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return formatTime(date);
  };

  const generateReminders = () => {
    if (!enabled || paused) return [];

    const intervalMinutes = getIntervalMinutes();
    if (!intervalMinutes) return [];

    const reminders = [];
    const sleepStartMinutes = toMinutes(sleepStartTime);
    const sleepEndMinutes = toMinutes(sleepEndTime);

    for (let minute = 0; minute < 24 * 60; minute += intervalMinutes) {
      if (
        sleepMode &&
        isWithinSleepWindow(minute, sleepStartMinutes, sleepEndMinutes)
      ) {
        continue;
      }
      reminders.push(formatMinutesToTime(minute));
      if (reminders.length >= 24) break;
    }

    return reminders;
  };

  const saveSettings = async () => {
    try {
      const savedAt = Date.now();
      const reminderData = {
        enabled,
        paused,
        pauseDurationMinutes,
        sleepMode,
        interval,
        customIntervalMinutes,
        sleepStartTime,
        sleepEndTime,
        activityLevel,
        updatedAt: savedAt,
      };

      await AsyncStorage.setItem("reminderSettings", JSON.stringify(reminderData));
      Alert.alert("Saved", "Reminder settings saved");

      let fcmToken = null;
      if (enabled) {
        try {
          fcmToken = await getPushTokenForBackend();
        } catch (tokenError) {
          console.log("[Reminders] Token fetch failed during save:", tokenError);
          fcmToken = null;
        }
      }
      console.log("[Reminders] Save initiated. Notifications enabled:", enabled);
      console.log("[Reminders] Token fetched for backend:", fcmToken);

      if (fcmToken) {
        try {
          await saveFcmToken(fcmToken);
          console.log("[Reminders] FCM token sent to backend via saveFcmToken.");
        } catch (tokenSyncError) {
          console.log("[Reminders] Failed to send FCM token via saveFcmToken:", tokenSyncError);
        }
      }

      const payload = {
        interval: getIntervalMinutes(),
        activityLevel,
        isActive: enabled,
        isPaused: paused,
        pauseDurationMinutes,
        sleepMode,
        sleepStartTime: toHHmm(sleepStartTime),
        sleepEndTime: toHHmm(sleepEndTime),
        ...(fcmToken ? { fcmToken } : {}),
      };

      try {
        await syncLocalReminderNotifications({
          enabled,
          paused,
          intervalMinutes: getIntervalMinutes(),
          sleepMode,
          sleepStartTime: toHHmm(sleepStartTime),
          sleepEndTime: toHHmm(sleepEndTime),
        });
        console.log("[Reminders] Local reminder sync completed.");
      } catch (notificationSyncError) {
        console.log(
          "[Reminders] Local reminder sync failed, continuing save:",
          notificationSyncError
        );
      }

      console.log("[Reminders] Sending reminder payload to backend:", payload);
      try {
        const response = await setReminder(payload);
        console.log("[Reminders] Backend reminder response:", response?.data);
        console.log(
          "[Reminders] Backend stored token:",
          response?.data?.fcmToken || null
        );
        console.log("[Reminders] Reminder settings sent to backend successfully.");
      } catch (apiError) {
        console.log("[Reminders] Backend save failed; local settings are still saved:", apiError);
      }

    } catch (error) {
      console.log("[Reminders] Failed to save reminder settings:", error);
      console.log(error);
      Alert.alert("Error", "Unable to save reminder settings right now.");
    }
  };

  const loadSettings = async () => {
    try {
      const res = await getReminder().catch(() => null);
      const serverReminder = res?.data;
      const localRaw = await AsyncStorage.getItem("reminderSettings");
      const localReminder = localRaw ? JSON.parse(localRaw) : null;

      const serverUpdatedAt = serverReminder?.updatedAt
        ? new Date(serverReminder.updatedAt).getTime()
        : 0;
      const localUpdatedAt = Number(localReminder?.updatedAt || 0);
      const shouldUseServer = Boolean(serverReminder) && serverUpdatedAt >= localUpdatedAt;

      if (shouldUseServer) {
        setEnabled(Boolean(serverReminder.isActive));
        setPaused(Boolean(serverReminder.isPaused));
        setPauseDurationMinutes(Number(serverReminder.pauseDurationMinutes || 60));
        setSleepMode(Boolean(serverReminder.sleepMode));
        setActivityLevel(serverReminder.activityLevel || "Moderate");
        const serverInterval = Number(serverReminder.interval);
        const label = intervalLabelFromMinutes[serverInterval];
        if (label) {
          setReminderInterval(label);
          setCustomIntervalMinutes("45");
        } else if (serverInterval > 0) {
          setReminderInterval("Custom");
          setCustomIntervalMinutes(String(serverInterval));
        } else {
          setReminderInterval("30 minutes");
          setCustomIntervalMinutes("45");
        }
        setSleepStartTime(fromHHmm(serverReminder.sleepStartTime || "22:00"));
        setSleepEndTime(fromHHmm(serverReminder.sleepEndTime || "06:00"));
        return;
      }

      if (localReminder) {
        setEnabled(Boolean(localReminder.enabled));
        setPaused(Boolean(localReminder.paused));
        setPauseDurationMinutes(Number(localReminder.pauseDurationMinutes || 60));
        setSleepMode(Boolean(localReminder.sleepMode));
        setReminderInterval(localReminder.interval || "30 minutes");
        setCustomIntervalMinutes(String(localReminder.customIntervalMinutes || "45"));
        setActivityLevel(localReminder.activityLevel || "Moderate");
        setSleepStartTime(new Date(localReminder.sleepStartTime || new Date()));
        setSleepEndTime(new Date(localReminder.sleepEndTime || new Date()));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const reminderTimes = generateReminders();
  
  const openNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert("Error", "Unable to open app settings.");
    }
  };

  const previewText = sleepMode
    ? `You'll receive reminders every ${getIntervalLabel()}. Except between ${formatTime(
        sleepStartTime
      )} and ${formatTime(sleepEndTime)}.`
    : `You'll receive reminders every ${getIntervalLabel()} throughout the day.`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Reminders</Text>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={18} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Enable Reminders</Text>
              <Text style={styles.cardSub}>Master switch for all reminders</Text>
            </View>
          </View>

          <Switch
            value={enabled}
            onValueChange={(value) => {
              setEnabled(value);
              console.log("[Reminders] Enable reminders toggled:", value);
              if (value) {
                ensureNotificationPermission().catch((error) => {
                  console.log("[Reminders] Permission request failed on toggle:", error);
                });
                syncFcmTokenToBackend()
                  .then((synced) => {
                    console.log("[Reminders] FCM sync on toggle result:", synced);
                  })
                  .catch((error) => {
                    console.log("[Reminders] FCM sync on toggle failed:", error);
                  });
                getPushTokenForBackend()
                  .then((token) => {
                    console.log("[Reminders] Token fetched after enabling reminders:", token);
                  })
                  .catch((error) => {
                    console.log("[Reminders] Token fetch failed after enabling reminders:", error);
                  });
              }
            }}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
          />
        </View>
        
        <TouchableOpacity
          style={styles.openSettingsBtn}
          onPress={openNotificationSettings}
        >
          <Ionicons name="settings-outline" size={16} color="#2563eb" />
          <Text style={styles.openSettingsText}>Open Notification Settings</Text>
        </TouchableOpacity>

        <View style={styles.cardRow}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="pause-outline" size={18} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Pause Reminders</Text>
              <Text style={styles.cardSub}>Temporarily stop alerts instantly</Text>
            </View>
          </View>

          <Switch
            value={paused}
            onValueChange={setPaused}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
          />
        </View>

        {paused && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Auto Resume After</Text>
            {pauseDurations.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.intervalBtn,
                  pauseDurationMinutes === item.value && styles.intervalActive,
                ]}
                onPress={() => setPauseDurationMinutes(item.value)}
              >
                <Text
                  style={[
                    styles.intervalText,
                    pauseDurationMinutes === item.value && { color: "#fff" },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="moon-outline" size={18} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Sleep Mode</Text>
                <Text style={styles.cardSub}>Pause reminders during sleep hours</Text>
              </View>
            </View>

            <Switch
              value={sleepMode}
              onValueChange={setSleepMode}
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            />
          </View>

          {sleepMode && (
            <View style={styles.sleepTimesWrap}>
              <Text style={styles.inputLabel}>Sleep Start Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowSleepStart(true)}
              >
                <Text>{formatTime(sleepStartTime)}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Sleep End Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowSleepEnd(true)}
              >
                <Text>{formatTime(sleepEndTime)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reminder Interval</Text>

          {intervals.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.intervalBtn,
                interval === item && styles.intervalActive,
              ]}
              onPress={() => setReminderInterval(item)}
            >
              <Text
                style={[
                  styles.intervalText,
                  interval === item && { color: "#fff" },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}

          {interval === "Custom" && (
            <>
              <Text style={styles.inputLabel}>Custom Interval (minutes)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={customIntervalMinutes}
                onChangeText={(value) => {
                  const numeric = value.replace(/[^0-9]/g, "");
                  setCustomIntervalMinutes(numeric);
                }}
                placeholder="Enter minutes"
              />
            </>
          )}
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>{previewText}</Text>

          {enabled && !paused && (
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleTitle}>Sample Schedule</Text>
              {reminderTimes.slice(0, 12).map((time, index) => (
                <Text key={`${time}-${index}`} style={styles.scheduleItem}>
                  {time}
                </Text>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveText}>Save Settings</Text>
        </TouchableOpacity>

        {showSleepStart && (
          <DateTimePicker
            value={sleepStartTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onChangeSleepStart}
          />
        )}

        {showSleepEnd && (
          <DateTimePicker
            value={sleepEndTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onChangeSleepEnd}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#e6f0f4",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },

  cardRow: {
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardTitle: {
    fontWeight: "700",
  },

  cardSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },

  openSettingsBtn: {
    backgroundColor: "#eff6ff",
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  openSettingsText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  sectionCard: {
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
  },

  sleepTimesWrap: {
    marginTop: 10,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  inputLabel: {
    marginTop: 8,
    fontSize: 13,
    color: "#374151",
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },

  intervalBtn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    marginTop: 10,
    alignItems: "center",
  },

  intervalActive: {
    backgroundColor: "#3b82f6",
  },

  intervalText: {
    fontWeight: "600",
  },

  previewCard: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#0ea5e9",
  },

  previewTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
  },

  previewText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },

  scheduleBox: {
    marginTop: 12,
    backgroundColor: "#0284c7",
    padding: 12,
    borderRadius: 12,
  },

  scheduleTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
  },

  scheduleItem: {
    color: "#e0f2fe",
    fontSize: 13,
    marginBottom: 2,
  },

  saveBtn: {
    backgroundColor: "#3b82f6",
    margin: 20,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
