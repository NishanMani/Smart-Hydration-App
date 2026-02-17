import express from "express";
import {
  createWaterLog,
  updateWaterLog,
  deleteWaterLog,
  getDailySummary,
  getHistoryInsights
} from "../controllers/waterLogController.js";
import exportHistoryPdf from  '../services/pdfReport.js'
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, createWaterLog);
router.put("/update/:id", protect, updateWaterLog);
router.delete("/:id", protect, deleteWaterLog);
router.get("/daily", protect, getDailySummary);
router.get("/history", protect, getHistoryInsights);
router.get("/history/export/pdf", protect, exportHistoryPdf);

export default router;
