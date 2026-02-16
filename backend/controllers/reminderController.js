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

    res.json(reminder);
  } catch (error) {
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
