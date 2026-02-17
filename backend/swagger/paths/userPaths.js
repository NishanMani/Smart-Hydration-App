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
                email: { type: "string", format: "email" },
                weight: { type: "number" },
                height: { type: "number" },
                age: { type: "number" },
                gender: { type: "string" },
                activityLevel: { type: "string" },
                climate: { type: "string" },
                lifestyle: { type: "string" },
                dailyGoal: { type: "number" },
                unit: { type: "string", enum: ["ml", "oz"] },
                pregnant: { type: "boolean" },
                breastfeeding: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "User profile updated" },
        401: { description: "Unauthorized" },
        404: { description: "User not found" },
      },
    },
  },
};

export default userPaths;
