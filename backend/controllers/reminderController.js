import Reminder from "../models/reminder.js";

const DEFAULT_ACTIVITY_LEVEL = "Moderate";
const DEFAULT_INTERVAL = 30;
const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "22:00";
const DEFAULT_SLEEP_START = "22:00";
const DEFAULT_SLEEP_END = "06:00";
const DEFAULT_PAUSE_DURATION = 60;

const activityLevelMap = {
  low: "Sedentary",
  high: "Very Active",
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  "very active": "Very Active",
};

const normalizeActivityLevel = (value) => {
  if (!value) return DEFAULT_ACTIVITY_LEVEL;
  const normalized = String(value).trim().toLowerCase();
  return activityLevelMap[normalized] || DEFAULT_ACTIVITY_LEVEL;
};

const toValidDuration = (value, fallback = DEFAULT_PAUSE_DURATION) => {
  return Math.max(1, Number(value || fallback));
};

const getPausedUntilFromDuration = (durationMinutes) => {
  return new Date(Date.now() + durationMinutes * 60 * 1000);
};

const sendServerError = (res, error) => {
  res.status(500).json({ message: error.message });
};

const applyPauseState = (reminder, shouldPause, durationMinutes) => {
  reminder.isPaused = shouldPause;
  reminder.pauseDurationMinutes = durationMinutes;
  reminder.pausedUntil = shouldPause
    ? getPausedUntilFromDuration(durationMinutes)
    : null;
};

export const getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.status(200).json(reminder);
  } catch (error) {
    sendServerError(res, error);
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

    let reminder = await Reminder.findOne({ userId: req.user.id });

    if (reminder) {
      if (interval !== undefined) reminder.interval = interval;
      if (startTime !== undefined) reminder.startTime = startTime;
      if (endTime !== undefined) reminder.endTime = endTime;
      if (sleepStartTime !== undefined) reminder.sleepStartTime = sleepStartTime;
      if (sleepEndTime !== undefined) reminder.sleepEndTime = sleepEndTime;
      if (fcmToken) reminder.fcmToken = fcmToken;
      if (activityLevel !== undefined) {
        reminder.activityLevel = normalizeActivityLevel(activityLevel);
      }
      if (typeof isActive === "boolean") reminder.isActive = isActive;
      if (typeof sleepMode === "boolean") reminder.sleepMode = sleepMode;

      if (pauseDurationMinutes !== undefined) {
        reminder.pauseDurationMinutes = toValidDuration(
          pauseDurationMinutes,
          DEFAULT_PAUSE_DURATION
        );
      }

      if (typeof isPaused === "boolean") {
        const duration = toValidDuration(
          pauseDurationMinutes,
          reminder.pauseDurationMinutes || DEFAULT_PAUSE_DURATION
        );
        applyPauseState(reminder, isPaused, duration);
      }

      await reminder.save();
      return res.json(reminder);
    }

    const initialPauseDuration = toValidDuration(
      pauseDurationMinutes,
      DEFAULT_PAUSE_DURATION
    );
    const shouldPause = typeof isPaused === "boolean" ? isPaused : false;

    reminder = await Reminder.create({
      userId: req.user.id,
      interval: interval || DEFAULT_INTERVAL,
      startTime: startTime || DEFAULT_START_TIME,
      endTime: endTime || DEFAULT_END_TIME,
      sleepStartTime: sleepStartTime || DEFAULT_SLEEP_START,
      sleepEndTime: sleepEndTime || DEFAULT_SLEEP_END,
      fcmToken,
      activityLevel: normalizeActivityLevel(activityLevel),
      isActive: typeof isActive === "boolean" ? isActive : true,
      isPaused: shouldPause,
      sleepMode: typeof sleepMode === "boolean" ? sleepMode : false,
      pauseDurationMinutes: initialPauseDuration,
      pausedUntil: shouldPause
        ? getPausedUntilFromDuration(initialPauseDuration)
        : null,
    });

    res.json(reminder);
  } catch (error) {
    sendServerError(res, error);
  }
};

export const setReminderPause = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const shouldPause =
      typeof req.body?.isPaused === "boolean"
        ? req.body.isPaused
        : !reminder.isPaused;
    const duration = toValidDuration(
      req.body?.pauseDurationMinutes,
      reminder.pauseDurationMinutes || DEFAULT_PAUSE_DURATION
    );

    applyPauseState(reminder, shouldPause, duration);
    await reminder.save();

    res.json({
      message: shouldPause ? "Reminder paused" : "Reminder resumed",
      reminder,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const toggleSleepMode = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ userId: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const nextSleepMode =
      typeof req.body?.sleepMode === "boolean"
        ? req.body.sleepMode
        : !reminder.sleepMode;

    reminder.sleepMode = nextSleepMode;
    await reminder.save();

    res.json({ message: "Sleep mode updated", reminder });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: { fcmToken: token },
        $setOnInsert: {
          interval: DEFAULT_INTERVAL,
          startTime: DEFAULT_START_TIME,
          endTime: DEFAULT_END_TIME,
          sleepStartTime: DEFAULT_SLEEP_START,
          sleepEndTime: DEFAULT_SLEEP_END,
          activityLevel: DEFAULT_ACTIVITY_LEVEL,
          isActive: true,
          isPaused: false,
          sleepMode: false,
          pauseDurationMinutes: DEFAULT_PAUSE_DURATION,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: "Token saved", reminder });
  } catch (error) {
    sendServerError(res, error);
  }
};
