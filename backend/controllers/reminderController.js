import Reminder from "../models/reminder.js";

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
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
    console.log(
      "[Reminder API] /set request received:",
      JSON.stringify({
        userId: req.user.id,
        hasFcmToken: Boolean(fcmToken),
        fcmToken: fcmToken || null,
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
      if (interval !== undefined) reminder.interval = interval;
      if (startTime !== undefined) reminder.startTime = startTime;
      if (endTime !== undefined) reminder.endTime = endTime;
      if (sleepStartTime !== undefined) reminder.sleepStartTime = sleepStartTime;
      if (sleepEndTime !== undefined) reminder.sleepEndTime = sleepEndTime;
      if (fcmToken) reminder.fcmToken = fcmToken;
      if (activityLevel !== undefined) reminder.activityLevel = normalizedActivityLevel;
      if (typeof isActive === "boolean") reminder.isActive = isActive;
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
      }

      await reminder.save();
    } else {
      reminder = await Reminder.create({
        userId: req.user.id,
        interval: interval || 30,
        startTime: startTime || "08:00",
        endTime: endTime || "22:00",
        sleepStartTime: sleepStartTime || "22:00",
        sleepEndTime: sleepEndTime || "06:00",
        fcmToken,
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

<<<<<<< HEAD
    console.log(
      "[Reminder API] /set saved reminder:",
      JSON.stringify({
        userId: req.user.id,
        reminderId: reminder._id,
        storedFcmToken: reminder.fcmToken || null,
      })
    );
=======
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

>>>>>>> origin/main
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

<<<<<<< HEAD
    const shouldPause = typeof req.body?.isPaused === "boolean"
      ? req.body.isPaused
      : !reminder.isPaused;
    const duration = Math.max(
      1,
      Number(req.body?.pauseDurationMinutes || reminder.pauseDurationMinutes || 60)
    );
=======
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
>>>>>>> origin/main

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
<<<<<<< HEAD
    res.status(500).json({ message: error.message });
=======
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
>>>>>>> origin/main
  }
};
