import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interval: {
      type: Number, // minutes
      required: true,
    },

    startTime: {
      type: String, // "08:00"
      required: true,
    },

    endTime: {
      type: String, // "22:00"
      required: true,
    },

    sleepStartTime: {
<<<<<<< HEAD
      type: String, // "22:00"
      default: "22:00",
    },

    sleepEndTime: {
      type: String, // "06:00"
      default: "06:00",
=======
      type: String, 
    },

    sleepEndTime: {
      type: String, 
>>>>>>> origin/main
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
