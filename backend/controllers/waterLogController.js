import mongoose from "mongoose";
import WaterLog from "../models/waterLog.js";
 
const DEFAULT_DAILY_GOAL = 2000;
const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 1000;
const IST_OFFSET_MINUTES = 5 * 60 + 30;
 
const getTodayRange = () => {
  const now = new Date();
 
  const start = new Date(now);
  start.setUTCHours(0 - 5, -30, 0, 0);
 
  const end = new Date(now);
  end.setUTCHours(23 - 5, 59 - 30, 59, 999);
 
  return { start, end };
};
 
const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};
 
const toEndOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};
 
const formatDateKey = (value) => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toISTISOString = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istDate.toISOString().replace("Z", "+05:30");
};

const serializeWaterLog = (log) => {
  const plainLog = typeof log?.toObject === "function" ? log.toObject() : log;
  if (!plainLog) return plainLog;

  return {
    ...plainLog,
    date: toISTISOString(plainLog.date),
    createdAt: toISTISOString(plainLog.createdAt),
    updatedAt: toISTISOString(plainLog.updatedAt),
  };
};
 
const getUserGoalPerDay = (req) => {
  const parsedGoal = Number(req.user?.dailyGoal || 0);
  return parsedGoal > 0 ? parsedGoal : DEFAULT_DAILY_GOAL;
};
 
const getBadgeFromStreak = (streak) => {
  if (streak >= 30) return "Hydration Champion";
  if (streak >= 14) return "Hydration Pro";
  if (streak >= 7) return "Consistency Star";
  if (streak >= 3) return "Getting There";
  return "Start Your Journey";
};
 
const parseHistoryRange = (query) => {
  const now = new Date();
  const parsedFrom = query?.from ? new Date(query.from) : null;
  const parsedTo = query?.to ? new Date(query.to) : null;
 
  const hasValidFrom = parsedFrom && !Number.isNaN(parsedFrom.getTime());
  const hasValidTo = parsedTo && !Number.isNaN(parsedTo.getTime());
 
  let start = hasValidFrom ? toStartOfDay(parsedFrom) : toStartOfDay(now);
  let end = hasValidTo ? toEndOfDay(parsedTo) : toEndOfDay(now);
 
  if (!hasValidFrom) {
    start.setDate(start.getDate() - 29);
  }
 
  if (start > end) {
    start = toStartOfDay(end);
    start.setDate(start.getDate() - 29);
  }
 
  return { start, end };
};
 
const parsePagination = (query) => {
  const page = Math.max(1, Number(query?.page || 1));
  const rawLimit = Number(query?.limit || DEFAULT_HISTORY_LIMIT);
  const safeLimit = Number.isFinite(rawLimit) ? rawLimit : DEFAULT_HISTORY_LIMIT;
  const limit = Math.min(Math.max(1, safeLimit), MAX_HISTORY_LIMIT);
  const skip = (page - 1) * limit;
 
  return { page, limit, skip };
};
 
const buildDateMathRanges = (endDate) => {
  const now = new Date();
 
  const weeklyStart = toStartOfDay(now);
  weeklyStart.setDate(weeklyStart.getDate() - 6);
 
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  previousMonthEnd.setHours(23, 59, 59, 999);
 
  const streakLookback = toStartOfDay(now);
  streakLookback.setDate(streakLookback.getDate() - 90);
 
  return {
    weeklyStart,
    currentMonthStart,
    previousMonthStart,
    previousMonthEnd,
    streakLookback,
    endDate,
    now,
  };
};
 
const getWeeklyStats = (weeklyTotals, weeklyStart, goalPerDay) => {
  const weeklyMap = weeklyTotals.reduce((acc, item) => {
    acc[item._id] = Number(item.totalIntake || 0);
    return acc;
  }, {});
 
  const weeklyTotalIntake = Array.from({ length: 7 }).reduce((sum, _, offset) => {
    const date = new Date(weeklyStart);
    date.setDate(weeklyStart.getDate() + offset);
    return sum + Number(weeklyMap[formatDateKey(date)] || 0);
  }, 0);
 
  const weeklyAvgIntake = Math.round(weeklyTotalIntake / 7);
  const weeklyPerformancePercent = Math.min(
    Math.round((weeklyAvgIntake / goalPerDay) * 100),
    100
  );
 
  return { weeklyAvgIntake, weeklyPerformancePercent };
};
 
const getMonthlyPercentChange = (currentMonthResult, previousMonthResult) => {
  const thisMonthTotal = Number(currentMonthResult?.[0]?.totalIntake || 0);
  const lastMonthTotal = Number(previousMonthResult?.[0]?.totalIntake || 0);
 
  const percentChange =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;
 
  return { thisMonthTotal, lastMonthTotal, percentChange };
};
 
const getCurrentStreak = (streakDailyTotals, goalPerDay, now) => {
  const streakMap = streakDailyTotals.reduce((acc, item) => {
    acc[item._id] = Number(item.totalIntake || 0);
    return acc;
  }, {});
 
  let streak = 0;
  const cursor = toStartOfDay(now);
 
  while (true) {
    const dayKey = formatDateKey(cursor);
    if (Number(streakMap[dayKey] || 0) >= goalPerDay) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
 
  return streak;
};
 
const sendBasicServerError = (res, error) => {
  res.status(500).json({ message: error.message });
};
 
const sendServerErrorWithSuccessFlag = (res, error) => {
  res.status(500).json({ success: false, message: error.message });
};
 
export const createWaterLog = async (req, res) => {
  try {
    const { amount } = req.body;
 
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid water amount" });
    }
 
    const waterLog = await WaterLog.create({
      userId: req.user.id,
      amount,
      date: new Date(),
    });
     console.log("Incoming amount:", req.body.amount);
    res.status(201).json(serializeWaterLog(waterLog));
  } catch (error) {
    sendBasicServerError(res, error);
  }
};
 
export const updateWaterLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
 
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid water amount" });
    }
 
    const waterLog = await WaterLog.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { amount },
      { new: true }
    );
    if (!waterLog) {
      return res.status(404).json({ message: "Log not found" });
    }
 
    res.json(serializeWaterLog(waterLog));
  } catch (error) {
    sendBasicServerError(res, error);
  }
};
 
export const deleteWaterLog = async (req, res) => {
  try {
    const { id } = req.params;
 
    const waterLog = await WaterLog.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
 
    if (!waterLog) {
      return res.status(404).json({ message: "Log not found" });
    }
 
    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    sendBasicServerError(res, error);
  }
};
 
export const getDailySummary = async (req, res) => {
  try {
    const { start, end } = getTodayRange();
 
    const logs = await WaterLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });
 
    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const dailyGoal = getUserGoalPerDay(req);
    const progress = Math.min((totalIntake / dailyGoal) * 100, 100);
 
    res.status(200).json({
      success: true,
      totalIntake,
      progress,
      remaining: Math.max(dailyGoal - totalIntake, 0),
      logs: logs.map(serializeWaterLog),
      date: toISTISOString(start),
    });
  } catch (error) {
    sendServerErrorWithSuccessFlag(res, error);
  }
};
 
export const getHistoryInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const goalPerDay = getUserGoalPerDay(req);
    const { page, limit, skip } = parsePagination(req.query);
    const { start, end } = parseHistoryRange(req.query);
    const ranges = buildDateMathRanges(end);
 
    const baseMatch = {
      userId,
      date: { $gte: start, $lte: end },
    };
 
    const [
      logs,
      countResult,
      dailyTotals,
      weeklyTotals,
      currentMonthTotalResult,
      previousMonthTotalResult,
      streakDailyTotals,
    ] = await Promise.all([
      WaterLog.aggregate([
        { $match: baseMatch },
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            amount: 1,
            date: 1,
            time: {
              $dateToString: {
                format: "%H:%M",
                date: "$date",
                timezone: "Asia/Kolkata",
              },
            },
          },
        },
      ]),
      WaterLog.aggregate([{ $match: baseMatch }, { $count: "total" }]),
      WaterLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            totalIntake: { $sum: "$amount" },
            logsCount: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: { $gte: ranges.weeklyStart, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            totalIntake: { $sum: "$amount" },
          },
        },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: { $gte: ranges.currentMonthStart, $lte: end },
          },
        },
        { $group: { _id: null, totalIntake: { $sum: "$amount" } } },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: {
              $gte: ranges.previousMonthStart,
              $lte: ranges.previousMonthEnd,
            },
          },
        },
        { $group: { _id: null, totalIntake: { $sum: "$amount" } } },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: { $gte: ranges.streakLookback, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
              },
            },
            totalIntake: { $sum: "$amount" },
          },
        },
      ]),
    ]);
 
    const totalLogs = Number(countResult?.[0]?.total || 0);
    const totalPages = totalLogs > 0 ? Math.ceil(totalLogs / limit) : 1;
 
    const { weeklyAvgIntake, weeklyPerformancePercent } = getWeeklyStats(
      weeklyTotals,
      ranges.weeklyStart,
      goalPerDay
    );
 
    const { thisMonthTotal, lastMonthTotal, percentChange } =
      getMonthlyPercentChange(currentMonthTotalResult, previousMonthTotalResult);
 
// <<<<<<< HEAD
    const streak = getCurrentStreak(streakDailyTotals, goalPerDay, ranges.now);
 
    const streakMap = streakDailyTotals.reduce((acc, item) => {
      acc[item._id] = Number(item.totalIntake || 0);
      return acc;
    }, {});
    // let streak = 0;
    const cursor = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    while (true) {
      const key = formatDateKey(cursor);
      if (Number(streakMap[key] || 0) >= goalPerDay) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
// >>>>>>> 7a85765ef48d09587ab8cd8286b01b67854bb060
 
    res.status(200).json({
      success: true,
      filters: { from: toISTISOString(start), to: toISTISOString(end) },
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages,
      },
      goalPerDay,
      logs: logs.map((log) => ({
        id: String(log._id),
        amount: Number(log.amount || 0),
        date: toISTISOString(log.date),
        time: log.time,
      })),
      dailyTotals: dailyTotals.map((item) => ({
        date: item._id,
        totalIntake: Number(item.totalIntake || 0),
        logsCount: Number(item.logsCount || 0),
      })),
      insights: {
        weeklyPerformance: {
          avgIntake: weeklyAvgIntake,
          completionPercent: weeklyPerformancePercent,
        },
        monthlyComparison: {
          thisMonthTotal,
          lastMonthTotal,
          percentChange,
        },
        streak: {
          current: streak,
          badge: getBadgeFromStreak(streak),
        },
      },
    });
  } catch (error) {
    sendServerErrorWithSuccessFlag(res, error);
  }
};
 
 
