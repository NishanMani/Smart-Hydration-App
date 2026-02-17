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
                paused: { type: "boolean" },
              },
              required: ["paused"],
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
};

export default reminderPaths;
