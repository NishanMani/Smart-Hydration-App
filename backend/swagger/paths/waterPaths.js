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
                timestamp: { type: "string", format: "date-time" },
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
                timestamp: { type: "string", format: "date-time" },
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
      responses: {
        200: { description: "History insights" },
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
