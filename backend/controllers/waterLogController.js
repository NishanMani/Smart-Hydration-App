import mongoose from "mongoose";
import WaterLog from "../models/waterLog.js";

const getTodayRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const DEFAULT_DAILY_GOAL = 2000;
const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 1000;

const getUserGoalPerDay = (req) => {
  const parsedGoal = Number(req.user?.dailyGoal || 0);
  return parsedGoal > 0 ? parsedGoal : DEFAULT_DAILY_GOAL;
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

const getBadgeFromStreak = (streak) => {
  if (streak >= 30) return "Hydration Champion";
  if (streak >= 14) return "Hydration Pro";
  if (streak >= 7) return "Consistency Star";
  if (streak >= 3) return "Getting There";
  return "Start Your Journey";
};

const calculateCurrentStreak = (streakMap, goalPerDay, now = new Date()) => {
  let streak = 0;
  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const todayKey = formatDateKey(cursor);
  if (Number(streakMap[todayKey] || 0) < goalPerDay) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    const key = formatDateKey(cursor);
    if (Number(streakMap[key] || 0) >= goalPerDay) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
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
    const fallbackStart = toStartOfDay(end);
    fallbackStart.setDate(fallbackStart.getDate() - 29);
    start = fallbackStart;
  }

  return { start, end };
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
    res.status(201).json(waterLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json(waterLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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

    res.status(200).json({ success: true, totalIntake, progress, remaining: Math.max(dailyGoal - totalIntake, 0), logs,date: start});

  } catch (error) {
    res.status(500).json({ success: false, message: error.message});
  }
};

export const getHistoryInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const goalPerDay = getUserGoalPerDay(req);
    const page = Math.max(1, Number(req.query?.page || 1));
    const rawLimit = Number(req.query?.limit || DEFAULT_HISTORY_LIMIT);
    const limit = Math.min(
      Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_HISTORY_LIMIT),
      MAX_HISTORY_LIMIT
    );
    const skip = (page - 1) * limit;

    const { start, end } = parseHistoryRange(req.query);
    const baseMatch = {
      userId,
      date: { $gte: start, $lte: end },
    };

    const now = new Date();
    const weeklyStart = toStartOfDay(now);
    weeklyStart.setDate(weeklyStart.getDate() - 6);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousMonthEnd.setHours(23, 59, 59, 999);
    const streakLookback = toStartOfDay(now);
    streakLookback.setDate(streakLookback.getDate() - 90);

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
            date: { $gte: weeklyStart, $lte: end },
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
            date: { $gte: currentMonthStart, $lte: end },
          },
        },
        { $group: { _id: null, totalIntake: { $sum: "$amount" } } },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: { $gte: previousMonthStart, $lte: previousMonthEnd },
          },
        },
        { $group: { _id: null, totalIntake: { $sum: "$amount" } } },
      ]),
      WaterLog.aggregate([
        {
          $match: {
            userId,
            date: { $gte: streakLookback, $lte: end },
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

    const thisMonthTotal = Number(currentMonthTotalResult?.[0]?.totalIntake || 0);
    const lastMonthTotal = Number(previousMonthTotalResult?.[0]?.totalIntake || 0);
    const monthlyPercentChange =
      lastMonthTotal > 0
        ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : 0;

    const streakMap = streakDailyTotals.reduce((acc, item) => {
      acc[item._id] = Number(item.totalIntake || 0);
      return acc;
    }, {});
    const streak = calculateCurrentStreak(streakMap, goalPerDay, now);

    res.status(200).json({
      success: true,
      filters: { from: start, to: end },
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
        date: log.date,
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
          percentChange: monthlyPercentChange,
        },
        streak: {
          current: streak,
          badge: getBadgeFromStreak(streak),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportHistoryPdf = async (req, res) => {
  try {
    let PDFDocument;
    try {
      ({ default: PDFDocument } = await import("pdfkit"));
    } catch (importError) {
      return res.status(500).json({
        success: false,
        message:
          "PDF export dependency missing. Install backend dependency 'pdfkit'.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { start, end } = parseHistoryRange(req.query);

    const logs = await WaterLog.find({
      userId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1 })
      .select("amount date");

    const totalsByDate = logs.reduce((acc, log) => {
      const key = formatDateKey(log.date);
      acc[key] = (acc[key] || 0) + Number(log.amount || 0);
      return acc;
    }, {});

    const fromLabel = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const toLabel = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(20).text("Hydration Report", { align: "left" });
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .fillColor("#444")
      .text(`Period: ${fromLabel} - ${toLabel}`);
    doc.text(`Total Logs: ${logs.length}`);
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor("#111").text("Daily Totals");
    doc.moveDown(0.4);

    const dailyKeys = Object.keys(totalsByDate).sort((a, b) => (a < b ? 1 : -1));
    if (dailyKeys.length === 0) {
      doc.fontSize(11).fillColor("#666").text("No logs found for this period.");
    } else {
      dailyKeys.forEach((key) => {
        doc.fontSize(11).fillColor("#222").text(`${key}: ${totalsByDate[key]} ml`);
      });
    }

    doc.moveDown(1);
    doc.fontSize(13).fillColor("#111").text("Log Entries");
    doc.moveDown(0.4);

    if (logs.length === 0) {
      doc.fontSize(11).fillColor("#666").text("No entries.");
    } else {
      logs.forEach((log) => {
        const date = new Date(log.date);
        const dateLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeLabel = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        doc
          .fontSize(10)
          .fillColor("#222")
          .text(`${dateLabel} ${timeLabel}  -  ${Number(log.amount || 0)} ml`);
      });
    }

    doc.end();

    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const fileName = `hydration-report-${formatDateKey(new Date())}.pdf`;
    res.status(200).json({
      success: true,
      fileName,
      base64: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
 
 
};
