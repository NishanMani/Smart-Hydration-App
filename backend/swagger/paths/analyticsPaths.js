export const analyticsPaths = {
  "/api/analytics/weekly": {
    get: {
      tags: ["Analytics"],
      summary: "Get weekly analytics",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Weekly analytics" },
      },
    },
  },
  "/api/analytics/monthly": {
    get: {
      tags: ["Analytics"],
      summary: "Get monthly analytics",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Monthly analytics" },
      },
    },
  },
  "/api/analytics/streak": {
    get: {
      tags: ["Analytics"],
      summary: "Get streak analytics",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Streak analytics" },
      },
    },
  },
  "/api/analytics/performance": {
    get: {
      tags: ["Analytics"],
      summary: "Get performance analytics",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Performance analytics" },
      },
    },
  },
  "/api/analytics/trend": {
    get: {
      tags: ["Analytics"],
      summary: "Get trend analytics",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Trend analytics" },
      },
    },
  },
};

export default analyticsPaths;
