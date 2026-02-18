import Reminder from "../models/reminder.js";

const normalizeActivityLevel = (value) => {
  if (!value) return "Moderate";
  const raw = String(value).trim();
  const lower = raw.toLowerCase();

  if (lower === "low") return "Sedentary";
  if (lower === "high") return "Very Active";
  if (lower === "sedentary") return "Sedentary";
  if (lower === "light") return "Light";
  if (lower === "moderate") return "Moderate";
  if (lower === "active") return "Active";
  if (lower === "very active") return "Very Active";

  return "Moderate";
};

const normalizePushToken = (value) => {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!token) return null;
  if (token.toLowerCase() === "string") return null;
  return token;
};

const normalizeTimeValue = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.toLowerCase() === "string") return fallback;
  const isHHmm = /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed);
  return isHHmm ? trimmed : fallback;
};

export const getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrUpdateReminder = async (req, res) => {
  try {
    const {
      interval,
      startTime,
      endTime,
      sleepStartTime,
      sleepEndTime,
      fcmToken,
      activityLevel,
      isActive,
      isPaused,
      sleepMode,
      pauseDurationMinutes,
    } = req.body;
    const normalizedFcmToken = normalizePushToken(fcmToken);
    const normalizedStartTime = normalizeTimeValue(startTime, "08:00");
    const normalizedEndTime = normalizeTimeValue(endTime, "22:00");
    const normalizedSleepStartTime = normalizeTimeValue(sleepStartTime, "22:00");
    const normalizedSleepEndTime = normalizeTimeValue(sleepEndTime, "06:00");

    console.log(
      "[Reminder API] /set request received:",
      JSON.stringify({
        userId: req.user.id,
        hasFcmToken: Boolean(normalizedFcmToken),
        fcmToken: normalizedFcmToken || null,
      })
    );

    let reminder = await Reminder.findOne({ userId: req.user.id });
    const normalizedActivityLevel =
      activityLevel !== undefined
        ? normalizeActivityLevel(activityLevel)
        : undefined;

    if (activityLevel !== undefined && !normalizedActivityLevel) {
      return sendBadRequest(res, "Invalid activityLevel");
    }

    if (reminder) {
      // Clean up legacy placeholder tokens from old test payloads.
      if (normalizePushToken(reminder.fcmToken) === null) {
        reminder.fcmToken = null;
      }

      if (interval !== undefined) reminder.interval = interval;
      if (startTime !== undefined) reminder.startTime = normalizedStartTime;
      if (endTime !== undefined) reminder.endTime = normalizedEndTime;
      if (sleepStartTime !== undefined) reminder.sleepStartTime = normalizedSleepStartTime;
      if (sleepEndTime !== undefined) reminder.sleepEndTime = normalizedSleepEndTime;
      if (fcmToken !== undefined) reminder.fcmToken = normalizedFcmToken;
      if (activityLevel !== undefined) reminder.activityLevel = normalizedActivityLevel;
      if (typeof isActive === "boolean") reminder.isActive = isActive;
      if (typeof isPaused === "boolean") {
        reminder.isPaused = isPaused;
        if (isPaused) {
          const duration = Math.max(1, Number(pauseDurationMinutes || reminder.pauseDurationMinutes || 60));
          reminder.pauseDurationMinutes = duration;
          reminder.pausedUntil = new Date(Date.now() + duration * 60000);
        } else {
          reminder.pausedUntil = null;
        }
      }
      if (typeof sleepMode === "boolean") reminder.sleepMode = sleepMode;
      if (pauseDurationMinutes !== undefined) {
        reminder.pauseDurationMinutes = Math.max(1, Number(pauseDurationMinutes || 60));
      }

      await reminder.save();
    } else {
      reminder = await Reminder.create({
        userId: req.user.id,
        interval: interval || 30,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        sleepStartTime: normalizedSleepStartTime,
        sleepEndTime: normalizedSleepEndTime,
        fcmToken: normalizedFcmToken,
        activityLevel: normalizeActivityLevel(activityLevel),
        isActive: typeof isActive === "boolean" ? isActive : true,
        isPaused: typeof isPaused === "boolean" ? isPaused : false,
        sleepMode: typeof sleepMode === "boolean" ? sleepMode : false,
        pauseDurationMinutes: Math.max(1, Number(pauseDurationMinutes || 60)),
        pausedUntil:
          typeof isPaused === "boolean" && isPaused
            ? new Date(
                Date.now() +
                  Math.max(1, Number(pauseDurationMinutes || 60)) * 60000
              )
            : null,
      });
    }

    console.log(
      "[Reminder API] /set saved reminder:",
      JSON.stringify({
        userId: req.user.id,
        reminderId: reminder._id,
        storedFcmToken: reminder.fcmToken || null,
      })
    );
    res.json(reminder);
  } catch (error) {
    console.error("[Reminder API] /set failed:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const setReminderPause = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const shouldPause = typeof req.body?.isPaused === "boolean"
      ? req.body.isPaused
      : !reminder.isPaused;
    const duration = Math.max(
      1,
      Number(req.body?.pauseDurationMinutes || reminder.pauseDurationMinutes || 60)
    );

    reminder.isPaused = shouldPause;
    reminder.pauseDurationMinutes = duration;
    reminder.pausedUntil = shouldPause
      ? new Date(Date.now() + duration * 60000)
      : null;
    await reminder.save();

    res.json({
      message: shouldPause ? "Reminder paused" : "Reminder resumed",
      reminder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSleepMode = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const nextSleepMode = typeof req.body?.sleepMode === "boolean"
      ? req.body.sleepMode
      : !reminder.sleepMode;
    reminder.sleepMode = nextSleepMode;
    await reminder.save();

    res.json({ message: "Sleep mode updated", reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
