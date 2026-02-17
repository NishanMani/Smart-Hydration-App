import cron from "node-cron";
import Reminder from "../models/reminder.js";
import WaterLog from "../models/waterLog.js";
import User from "../models/userModel.js";
import { sendPushNotification } from "../services/notificationService.js";

const DEFAULT_GOAL = 2000;
const MINUTES_IN_DAY = 24 * 60;

const toMinutesFromTimeString = (time, fallbackHour) => {
  const [hourRaw, minuteRaw] = String(time).split(":").map(Number);
  const hour = Number.isFinite(hourRaw) ? hourRaw : fallbackHour;
  const minute = Number.isFinite(minuteRaw) ? minuteRaw : 0;
  return hour * 60 + minute;
};

const isWithinSleepWindow = (sleepStart, sleepEnd) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sleepStartMinutes = toMinutesFromTimeString(sleepStart || "22:00", 22);
  const sleepEndMinutes = toMinutesFromTimeString(sleepEnd || "06:00", 6);

  if (sleepStartMinutes === sleepEndMinutes) return false;

  if (sleepStartMinutes > sleepEndMinutes) {
    return (
      currentMinutes >= sleepStartMinutes || currentMinutes < sleepEndMinutes
    );
  }

  return currentMinutes >= sleepStartMinutes && currentMinutes < sleepEndMinutes;
};

const processPauseState = async (reminder) => {
  if (!reminder.isPaused) return false;

  const isPauseExpired =
    reminder.pausedUntil && new Date(reminder.pausedUntil) <= new Date();

  if (isPauseExpired) {
    reminder.isPaused = false;
    reminder.pausedUntil = null;
    await reminder.save();
    return false;
  }

  return true;
};

const recentlyNotified = (reminder, now) => {
  if (!reminder.lastNotifiedAt) return false;

  const minutesSinceLastNotification = (now - reminder.lastNotifiedAt) / 60000;
  return minutesSinceLastNotification < reminder.interval;
};

const getStartOfToday = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

const buildHydrationMessage = ({ reminder, logs, totalIntake, goal, now, startOfDay }) => {
  let message = "Time to drink water 💧";

  const elapsedDayMinutes = Math.max(1, (now - startOfDay) / 60000);
  const expectedByNow = Math.min(
    goal,
    Math.round((goal * elapsedDayMinutes) / MINUTES_IN_DAY)
  );

  if (totalIntake < expectedByNow * 0.6) {
    message = "You're behind your hydration pace 🚰 Drink now!";
  }

  if (logs.length > 0) {
    const lastDrinkAt = new Date(logs[0].createdAt);
    const minutesSinceLastDrink = (now - lastDrinkAt) / 60000;

    if (minutesSinceLastDrink >= reminder.interval * 1.5) {
      message = "It has been a while since your last drink 💧";
    }
  } else if (elapsedDayMinutes > 120) {
    message = "No water logged yet today. Start hydrating 💦";
  }

  if (
    reminder.activityLevel === "Active" ||
    reminder.activityLevel === "Very Active" ||
    reminder.activityLevel === "High"
  ) {
    message = "High activity detected 🔥 Stay hydrated now!";
  }

  return message;
};

const notifyIfNeeded = async (reminder) => {
  if (!reminder.fcmToken) return;

  const isPaused = await processPauseState(reminder);
  if (isPaused) return;

  if (
    reminder.sleepMode &&
    isWithinSleepWindow(reminder.sleepStartTime, reminder.sleepEndTime)
  ) {
    return;
  }

  const now = new Date();
  if (recentlyNotified(reminder, now)) return;

  const startOfDay = getStartOfToday();

  const [logs, user] = await Promise.all([
    WaterLog.find({
      userId: reminder.userId,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: -1 }),
    User.findById(reminder.userId).select("dailyGoal"),
  ]);

  const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
  const goal = Math.max(Number(user?.dailyGoal || 0), DEFAULT_GOAL);

  const message = buildHydrationMessage({
    reminder,
    logs,
    totalIntake,
    goal,
    now,
    startOfDay,
  });

  await sendPushNotification(reminder.fcmToken, "Hydration Reminder", message);

  reminder.lastNotifiedAt = now;
  await reminder.save();
};

cron.schedule(
  "*/1 * * * *",
  async () => {
    try {
      const reminders = await Reminder.find({ isActive: true });

      for (const reminder of reminders) {
        await notifyIfNeeded(reminder);
      }
    } catch (error) {
      console.error("Reminder Cron Error:", error.message);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("Reminder Cron Job Started");
