import WaterLog from "../models/waterLog.js";

const DEFAULT_DAILY_GOAL = 2000;

const getUserDailyGoal = (req) => {
  const parsedGoal = Number(req.user?.dailyGoal || 0);
  return parsedGoal > 0 ? parsedGoal : DEFAULT_DAILY_GOAL;
};

// Helper to get date range for analytics
const getDateRange = (type) => {
  const now = new Date();
  let start, end;

  switch (type) {
    case "week":
      // Rolling last 7 days (including today)
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;

    case "month":
      // Rolling last 30 days (including today)
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getDayOffset = (rangeStart, dateValue) => {
  const dayStart = new Date(dateValue);
  dayStart.setHours(0, 0, 0, 0);
  return Math.floor((dayStart.getTime() - rangeStart.getTime()) / DAY_MS);
};

const calculateCurrentStreak = (totalsByDay, goalPerDay, today = new Date()) => {
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  // If today's goal is not yet met, evaluate streak from yesterday.
  const todayKey = cursor.toDateString();
  if (Number(totalsByDay[todayKey] || 0) < goalPerDay) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = cursor.toDateString();
    if (Number(totalsByDay[key] || 0) >= goalPerDay) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Weekly analytics
export const getWeeklyAnalytics = async (req, res) => {
  try {
    const { start, end } = getDateRange("week");

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const daysCount = 7;
    const dailyTotals = Array(daysCount).fill(0);

    logs.forEach((log) => {
      const dayIndex = getDayOffset(start, log.date);
      if (dayIndex >= 0 && dayIndex < daysCount) {
        dailyTotals[dayIndex] += log.amount;
      }
    });

    const goalPerDay = getUserDailyGoal(req);
    const totalIntake = dailyTotals.reduce((sum, val) => sum + val, 0);
    const dailyPercent = dailyTotals.map((amt) =>
      Math.min((amt / goalPerDay) * 100, 100)
    );

    res.json({ dailyTotals, dailyPercent, totalIntake, goalPerDay });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Monthly analytics
export const getMonthlyAnalytics = async (req, res) => {
  try {
    const { start, end } = getDateRange("month");

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const daysCount = 30;
    const dailyTotals = Array(daysCount).fill(0);

    logs.forEach((log) => {
      const dayIndex = getDayOffset(start, log.date);
      if (dayIndex >= 0 && dayIndex < daysCount) {
        dailyTotals[dayIndex] += log.amount;
      }
    });

    const totalIntake = dailyTotals.reduce((sum, val) => sum + val, 0);

    res.json({ dailyTotals, totalIntake });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Streak analytics
export const getStreakAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: today },
    });

    const goal = getUserDailyGoal(req);
    const daysMetGoal = {}; // corrected: object instead of Set

    logs.forEach((log) => {
      const day = log.date.toDateString();
      if (!daysMetGoal[day]) daysMetGoal[day] = 0;
      daysMetGoal[day] += log.amount;
    });

    const streak = calculateCurrentStreak(daysMetGoal, goal, today);

    res.json({ streak, goalPerDay: goal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Weekly performance percentage
export const getPerformance = async (req, res) => {
  try {
    const { start, end } = getDateRange("week");

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const daysCounted = 7;
    const goalPerDay = getUserDailyGoal(req);
    const maxGoal = goalPerDay * daysCounted;

    const performancePercent = Math.min((totalIntake / maxGoal) * 100, 100);

    res.json({ performancePercent, goalPerDay, totalIntake, maxGoal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Trend analytics (per drink event)
export const getTrendAnalytics = async (req, res) => {
  try {
    const range = req.query?.range === "month" ? "month" : "week";
    const { start, end } = getDateRange(range);

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .select("amount date");

    res.json({ range, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
