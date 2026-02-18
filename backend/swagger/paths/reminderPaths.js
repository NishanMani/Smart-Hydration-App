export const reminderPaths = {
  "/api/reminder/set": {
    post: {
      tags: ["Reminder"],
      summary: "Create or update reminder",
      description:
        "Creates a reminder when none exists, otherwise updates the existing reminder. Create requires interval, startTime, and endTime.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  type: "object",
                  required: ["interval", "startTime", "endTime"],
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
                    pauseDurationMinutes: { type: "number", minimum: 1, example: 60 },
                    sleepMode: { type: "boolean" },
                  },
                },
                {
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
                    pauseDurationMinutes: { type: "number", minimum: 1, example: 60 },
                    sleepMode: { type: "boolean" },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        200: { description: "Reminder saved" },
        400: { description: "Validation error" },
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
      description:
        "If isPaused is omitted, pause state is toggled. pauseDurationMinutes must be >= 1 when provided and is required if pausing without an existing stored duration.",
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
        400: { description: "Validation error" },
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
        404: { description: "Reminder not found" },
      },
    },
  },
};

export default reminderPaths;
