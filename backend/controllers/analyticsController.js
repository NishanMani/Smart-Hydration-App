import WaterLog from "../models/waterLog.js";

const DEFAULT_DAILY_GOAL = 2000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getUserDailyGoal = (req) => {
  const parsedGoal = Number(req.user?.dailyGoal || 0);
  return parsedGoal > 0 ? parsedGoal : DEFAULT_DAILY_GOAL;
};

const getRangeStartAndEnd = (rangeType) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (rangeType === "week") {
    start.setDate(start.getDate() - 6);
  }

  if (rangeType === "month") {
    start.setDate(start.getDate() - 29);
  }

  return { start, end };
};

const getDayIndexFromRangeStart = (rangeStart, logDate) => {
  const logDayStart = new Date(logDate);
  logDayStart.setHours(0, 0, 0, 0);

  return Math.floor((logDayStart.getTime() - rangeStart.getTime()) / DAY_IN_MS);
};

const buildDailyTotals = (logs, rangeStart, daysCount) => {
  const totals = Array(daysCount).fill(0);

  logs.forEach((log) => {
    const dayIndex = getDayIndexFromRangeStart(rangeStart, log.date);
    if (dayIndex >= 0 && dayIndex < daysCount) {
      totals[dayIndex] += log.amount;
    }
  });

  return totals;
};

const sendServerError = (res, error) => {
  res.status(500).json({ message: error.message });
};

export const getWeeklyAnalytics = async (req, res) => {
  try {
    const { start, end } = getRangeStartAndEnd("week");
    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const dailyTotals = buildDailyTotals(logs, start, 7);
    const goalPerDay = getUserDailyGoal(req);
    const totalIntake = dailyTotals.reduce((sum, amount) => sum + amount, 0);
    const dailyPercent = dailyTotals.map((amount) =>
      Math.min((amount / goalPerDay) * 100, 100)
    );

    res.json({ dailyTotals, dailyPercent, totalIntake, goalPerDay });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getMonthlyAnalytics = async (req, res) => {
  try {
    const { start, end } = getRangeStartAndEnd("month");
    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const dailyTotals = buildDailyTotals(logs, start, 30);
    const totalIntake = dailyTotals.reduce((sum, amount) => sum + amount, 0);

    res.json({ dailyTotals, totalIntake });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getStreakAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const lookbackStart = new Date(today);
    lookbackStart.setDate(lookbackStart.getDate() - 30);
    lookbackStart.setHours(0, 0, 0, 0);

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: lookbackStart, $lte: today },
    });

    const goalPerDay = getUserDailyGoal(req);
    const intakeByDay = {};

    logs.forEach((log) => {
      const dayKey = log.date.toDateString();
      intakeByDay[dayKey] = Number(intakeByDay[dayKey] || 0) + log.amount;
    });

    let streak = 0;
    const cursor = new Date(today);

    while (true) {
      const dayKey = cursor.toDateString();
      if (Number(intakeByDay[dayKey] || 0) >= goalPerDay) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak, goalPerDay });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getPerformance = async (req, res) => {
  try {
    const { start, end } = getRangeStartAndEnd("week");
    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    });

    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const goalPerDay = getUserDailyGoal(req);
    const maxGoal = goalPerDay * 7;
    const performancePercent = Math.min((totalIntake / maxGoal) * 100, 100);

    res.json({ performancePercent, goalPerDay, totalIntake, maxGoal });
  } catch (error) {
    sendServerError(res, error);
  }
};

export const getTrendAnalytics = async (req, res) => {
  try {
    const range = req.query?.range === "month" ? "month" : "week";
    const { start, end } = getRangeStartAndEnd(range);

    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .select("amount date");

    res.json({ range, logs });
  } catch (error) {
    sendServerError(res, error);
  }
};
