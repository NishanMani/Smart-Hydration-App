import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interval: {
      type: Number, 
      required: true,
    },

    startTime: {
      type: String, 
      required: true,
    },

    endTime: {
      type: String, 
      required: true,
    },

    sleepStartTime: {
      type: String, 
      default: "22:00",
    },

    sleepEndTime: {
      type: String, 
      default: "06:00",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPaused: {
      type: Boolean,
      default: false,
    },

    pauseDurationMinutes: {
      type: Number,
      default: 60,
    },

    pausedUntil: {
      type: Date,
    },

    sleepMode: {
      type: Boolean,
      default: false,
    },

    fcmToken: {
      type: String,
    },

    lastNotifiedAt: {
      type: Date,
    },

    activityLevel: {
      type: String,
      enum: [
        "Sedentary",
        "Light",
        "Moderate",
        "Active",
        "Very Active",
      ],
      default: "Moderate",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
