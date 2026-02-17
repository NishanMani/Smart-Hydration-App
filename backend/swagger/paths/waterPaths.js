export const waterPaths = {
  "/api/water/add": {
    post: {
      tags: ["Water"],
      summary: "Create water log",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                amount: { type: "number" },
              },
              required: ["amount"],
            },
          },
        },
      },
      responses: {
        201: { description: "Water log created" },
      },
    },
  },
  "/api/water/update/{id}": {
    put: {
      tags: ["Water"],
      summary: "Update water log",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                amount: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Water log updated" },
      },
    },
  },
  "/api/water/{id}": {
    delete: {
      tags: ["Water"],
      summary: "Delete water log",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Water log deleted" },
      },
    },
  },
  "/api/water/daily": {
    get: {
      tags: ["Water"],
      summary: "Get daily water summary",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Daily summary" },
      },
    },
  },
  "/api/water/history": {
    get: {
      tags: ["Water"],
      summary: "Get water history insights",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "query",
          name: "from",
          required: false,
          schema: { type: "string", format: "date" },
          description: "Start date in YYYY-MM-DD format",
        },
        {
          in: "query",
          name: "to",
          required: false,
          schema: { type: "string", format: "date" },
          description: "End date in YYYY-MM-DD format",
        },
        {
          in: "query",
          name: "page",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
        },
      ],
      responses: {
        200: {
          description: "History insights",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      totalLogs: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                  goalPerDay: { type: "number" },
                  logs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        userId: { type: "string" },
                        amount: { type: "number" },
                        date: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  dailyTotals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string", example: "2026-02-17" },
                        totalIntake: { type: "number" },
                        logsCount: { type: "integer" },
                      },
                    },
                  },
                  insights: {
                    type: "object",
                    properties: {
                      streak: {
                        type: "object",
                        properties: {
                          current: { type: "integer" },
                          badge: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/water/history/export/pdf": {
    get: {
      tags: ["Water"],
      summary: "Export water history as PDF",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "PDF export",
          content: {
            "application/pdf": {},
          },
        },
      },
    },
  },
};

export default waterPaths;
