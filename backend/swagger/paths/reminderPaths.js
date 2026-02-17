export const reminderPaths = {
  "/api/reminder/set": {
    post: {
      tags: ["Reminder"],
      summary: "Create or update reminder",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                interval: { type: "number" },
                startTime: { type: "string" },
                endTime: { type: "string" },
                sleepStartTime: { type: "string", example: "22:00" },
                sleepEndTime: { type: "string", example: "06:00" },
                fcmToken: { type: "string" },
                activityLevel: {
                  type: "string",
                  enum: ["Sedentary", "Light", "Moderate", "Active", "Very Active"],
                },
                isActive: { type: "boolean" },
                isPaused: { type: "boolean" },
                pauseDurationMinutes: { type: "number", example: 60 },
                sleepMode: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Reminder saved" },
      },
    },
  },
  "/api/reminder": {
    get: {
      tags: ["Reminder"],
      summary: "Get reminder settings",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Reminder details" },
      },
    },
  },
  "/api/reminder/pause": {
    put: {
      tags: ["Reminder"],
      summary: "Pause or resume reminders",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                isPaused: { type: "boolean" },
                pauseDurationMinutes: { type: "number", minimum: 1, example: 60 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Reminder pause state updated" },
      },
    },
  },
  "/api/reminder/sleep": {
    put: {
      tags: ["Reminder"],
      summary: "Toggle sleep mode",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                sleepMode: { type: "boolean" },
              },
              required: ["sleepMode"],
            },
          },
        },
      },
      responses: {
        200: { description: "Sleep mode updated" },
      },
    },
  },
  "/api/reminder/fcm-token": {
    put: {
      tags: ["Reminder"],
      summary: "Save FCM token for reminder notifications",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                token: { type: "string" },
              },
              required: ["token"],
            },
          },
        },
      },
      responses: {
        200: { description: "FCM token saved" },
        400: { description: "Token is required" },
      },
    },
  },
};

export default reminderPaths;
