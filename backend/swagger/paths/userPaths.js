export const userPaths = {
  "/api/user/profile": {
    get: {
      tags: ["User"],
      summary: "Get user profile",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "User profile details" },
        401: { description: "Unauthorized" },
      },
    },
    put: {
      tags: ["User"],
      summary: "Update user profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                weight: { type: "number" },
                age: { type: "number" },
                gender: { type: "string" },
                dailyGoal: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "User profile updated" },
        401: { description: "Unauthorized" },
      },
    },
  },
};

export default userPaths;
