export const authPaths = {
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                password: { type: "string", format: "password" },
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
              required: ["name", "email", "password"],
            },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "User registered successfully" },
                  userId: { type: "string", example: "67b2f3a9d8a9c12c6f44a111" },
                },
              },
            },
          },
        },
        400: {
          description: "Email already registered",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Email already registered" },
                },
              },
            },
          },
        },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Internal server error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", format: "password" },
              },
              required: ["email", "password"],
            },
          },
        },
      },
      responses: {
        200: { description: "Login successful" },
        401: { description: "Invalid credentials" },
      },
    },
  },
};

export default authPaths;
