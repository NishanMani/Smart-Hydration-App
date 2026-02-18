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
    },

    sleepEndTime: {
      type: String, 
    },

    isActive: {
      type: Boolean,
    },

    isPaused: {
      type: Boolean,
    },

    pauseDurationMinutes: {
      type: Number,
    },

    pausedUntil: {
      type: Date,
    },

    sleepMode: {
      type: Boolean,
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
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
