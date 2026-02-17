import cron from "node-cron";       //It is a scheduler that runs code automatically at a fixed time.
import Reminder from "../models/reminder.js";
import WaterLog from "../models/waterLog.js";
import { sendPushNotification } from "../services/notificationService.js";
import User from "../models/userModel.js";

const isWithinSleepWindow = (sleepStart, sleepEnd) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = String(sleepStart || "22:00").split(":").map(Number);
  const [eh, em] = String(sleepEnd || "06:00").split(":").map(Number);

  const sleepStartMinutes = (Number.isFinite(sh) ? sh : 22) * 60 + (Number.isFinite(sm) ? sm : 0);
  const sleepEndMinutes = (Number.isFinite(eh) ? eh : 6) * 60 + (Number.isFinite(em) ? em : 0);

  // Same start/end means no blocked sleep window.
  if (sleepStartMinutes === sleepEndMinutes) return false;

  // Overnight sleep window (e.g., 22:00 -> 06:00)
  if (sleepStartMinutes > sleepEndMinutes) {
    return currentMinutes >= sleepStartMinutes || currentMinutes < sleepEndMinutes;
  }

  // Same-day sleep window (e.g., 13:00 -> 15:00)
  return currentMinutes >= sleepStartMinutes && currentMinutes < sleepEndMinutes;
};

cron.schedule( "*/1 * * * *", async () => {
    try {
      const reminders = await Reminder.find({
        isActive: true,
      });

      for (const reminder of reminders) {
        if (!reminder.fcmToken) continue;

        // 1) Pause switch has highest priority: always skip.
        if (reminder.isPaused) {
          if (reminder.pausedUntil && new Date(reminder.pausedUntil) <= new Date()) {
            reminder.isPaused = false;
            reminder.pausedUntil = null;
            await reminder.save();
          } else {
            continue;
          }
        }

        // 2) Sleep mode blocks reminders inside the sleep window.
        if (
          reminder.sleepMode &&
          isWithinSleepWindow(reminder.sleepStartTime, reminder.sleepEndTime)
        ) {
          continue;
        }

        const now = new Date();

        if (
          reminder.lastNotifiedAt &&
          (now - reminder.lastNotifiedAt) / 60000 < reminder.interval
        )
          continue;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [logs, user] = await Promise.all([
          WaterLog.find({
            userId: reminder.userId,
            createdAt: { $gte: startOfDay },
          }).sort({ createdAt: -1 }),
          User.findById(reminder.userId).select("dailyGoal"),
        ]);

        const totalIntake = logs.reduce(
          (sum, log) => sum + log.amount,
          0
        );
        const goal = Math.max(Number(user?.dailyGoal || 0), 2000);

        let message = "Time to drink water 💧";

        const elapsedDayMinutes = Math.max(
          1,
          (now - startOfDay) / 60000
        );
        const expectedByNow = Math.min(
          goal,
          Math.round((goal * elapsedDayMinutes) / (24 * 60))
        );

        // Smart Logic 1: Missed expected intake by this time of day
        if (totalIntake < expectedByNow * 0.6) {
          message = "You're behind your hydration pace 🚰 Drink now!";
        }

        // Smart Logic 2: Time since last drink
        if (logs.length > 0) {
          const lastDrinkAt = new Date(logs[0].createdAt);
          const minutesSinceLastDrink = (now - lastDrinkAt) / 60000;
          if (minutesSinceLastDrink >= reminder.interval * 1.5) {
            message = "It has been a while since your last drink 💧";
          }
        } else if (elapsedDayMinutes > 120) {
          message = "No water logged yet today. Start hydrating 💦";
        }

        // Smart Logic 3: High activity users get stronger reminder
        if (
          reminder.activityLevel === "Active" ||
          reminder.activityLevel === "Very Active" ||
          reminder.activityLevel === "High"
        ) {
          message = "High activity detected 🔥 Stay hydrated now!";
        }

        await sendPushNotification(
          reminder.fcmToken,
          "Hydration Reminder",
          message
        );

        reminder.lastNotifiedAt = now;
        await reminder.save();
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
