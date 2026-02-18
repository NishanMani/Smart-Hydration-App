import mongoose from "mongoose";
import WaterLog from "../models/waterLog.js";

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

const formatDateKey = (value) => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const exportHistoryPdf = async (req, res) => {
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
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default exportHistoryPdf;
