import express from "express";
import {
  createOrUpdateReminder,
  toggleSleepMode,
  getReminder,
  setReminderPause,
} from "../controllers/reminderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/set", protect, createOrUpdateReminder);
router.get("/", protect, getReminder);
router.put("/pause", protect, setReminderPause);
router.put("/sleep", protect, toggleSleepMode);

export default router;
