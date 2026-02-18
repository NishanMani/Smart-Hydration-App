import Reminder from "../models/reminder.js";

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
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }
  const normalized = String(value).trim().toLowerCase();
  return activityLevelMap[normalized];
};

const toValidDuration = (value) => {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration < 1) return null;
  return duration;
};

const getPausedUntilFromDuration = (durationMinutes) => {
  return new Date(Date.now() + durationMinutes * 60 * 1000);
};

const sendBadRequest = (res, message) => {
  res.status(400).json({ message });
};

const sendServerError = (res, error) => {
  res.status(500).json({ message: error.message });
};

const applyPauseState = (reminder, shouldPause, durationMinutes) => {
  reminder.isPaused = shouldPause;
  if (durationMinutes !== undefined && durationMinutes !== null) {
    reminder.pauseDurationMinutes = durationMinutes;
  }
  reminder.pausedUntil = shouldPause
    ? getPausedUntilFromDuration(reminder.pauseDurationMinutes)
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
    const normalizedActivityLevel =
      activityLevel !== undefined
        ? normalizeActivityLevel(activityLevel)
        : undefined;

    if (activityLevel !== undefined && !normalizedActivityLevel) {
      return sendBadRequest(res, "Invalid activityLevel");
    }

    if (reminder) {
      if (interval !== undefined) reminder.interval = interval;
      if (startTime !== undefined) reminder.startTime = startTime;
      if (endTime !== undefined) reminder.endTime = endTime;
      if (sleepStartTime !== undefined) reminder.sleepStartTime = sleepStartTime;
      if (sleepEndTime !== undefined) reminder.sleepEndTime = sleepEndTime;
      if (fcmToken) reminder.fcmToken = fcmToken;
      if (activityLevel !== undefined) reminder.activityLevel = normalizedActivityLevel;
      if (typeof isActive === "boolean") reminder.isActive = isActive;
      if (typeof sleepMode === "boolean") reminder.sleepMode = sleepMode;

      if (pauseDurationMinutes !== undefined) {
        const parsedPauseDuration = toValidDuration(pauseDurationMinutes);
        if (!parsedPauseDuration) {
          return sendBadRequest(
            res,
            "pauseDurationMinutes must be a number greater than or equal to 1"
          );
        }
        reminder.pauseDurationMinutes = parsedPauseDuration;
      }

      if (typeof isPaused === "boolean") {
        const duration =
          pauseDurationMinutes !== undefined
            ? toValidDuration(pauseDurationMinutes)
            : reminder.pauseDurationMinutes;

        if (isPaused && !duration) {
          return sendBadRequest(
            res,
            "pauseDurationMinutes is required when pausing reminders"
          );
        }
        applyPauseState(reminder, isPaused, duration);
      }

      await reminder.save();
      return res.json(reminder);
    }

    if (interval === undefined || startTime === undefined || endTime === undefined) {
      return sendBadRequest(
        res,
        "interval, startTime, and endTime are required to create a reminder"
      );
    }

    let initialPauseDuration;
    if (pauseDurationMinutes !== undefined) {
      initialPauseDuration = toValidDuration(pauseDurationMinutes);
      if (!initialPauseDuration) {
        return sendBadRequest(
          res,
          "pauseDurationMinutes must be a number greater than or equal to 1"
        );
      }
    }

    const shouldPause = typeof isPaused === "boolean" ? isPaused : false;
    if (shouldPause && !initialPauseDuration) {
      return sendBadRequest(
        res,
        "pauseDurationMinutes is required when pausing reminders"
      );
    }

    const reminderPayload = {
      userId: req.user.id,
      interval,
      startTime,
      endTime,
      sleepStartTime,
      sleepEndTime,
      fcmToken,
      activityLevel: normalizedActivityLevel,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
      isPaused: shouldPause,
      sleepMode: typeof sleepMode === "boolean" ? sleepMode : undefined,
      pauseDurationMinutes: initialPauseDuration,
      pausedUntil: shouldPause ? getPausedUntilFromDuration(initialPauseDuration) : null,
    };

    Object.keys(reminderPayload).forEach((key) => {
      if (reminderPayload[key] === undefined) delete reminderPayload[key];
    });

    reminder = await Reminder.create(reminderPayload);

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

    const duration =
      req.body?.pauseDurationMinutes !== undefined
        ? toValidDuration(req.body.pauseDurationMinutes)
        : reminder.pauseDurationMinutes;

    if (req.body?.pauseDurationMinutes !== undefined && !duration) {
      return sendBadRequest(
        res,
        "pauseDurationMinutes must be a number greater than or equal to 1"
      );
    }

    if (shouldPause && !duration) {
      return sendBadRequest(
        res,
        "pauseDurationMinutes is required when pausing reminders"
      );
    }

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

    const reminder = await Reminder.findOne({ userId: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    reminder.fcmToken = token;
    await reminder.save();

    res.json({ message: "Token saved", reminder });
  } catch (error) {
    sendServerError(res, error);
  }
};
