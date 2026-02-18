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
                gender: { type: "string", enum: ["male", "female", "other"] },
                activityLevel: {
                  type: "string",
                  enum: ["Sedentary", "Light", "Moderate", "Active", "Very Active"],
                },
                climate: { type: "string", enum: ["Moderate", "Hot", "Cold"] },
                lifestyle: {
                  type: "string",
                  enum: ["Athlete", "Office Worker", "Outdoor Worker", "Senior"],
                },
                unit: { type: "string", enum: ["ml", "oz"] },
                pregnant: { type: "boolean" },
                breastfeeding: { type: "boolean" },
              },
              required: [
                "name",
                "email",
                "password",
                "weight",
                "height",
                "age",
                "gender",
                "activityLevel",
                "climate",
                "lifestyle",
                "unit",
                "pregnant",
                "breastfeeding",
              ],
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
          description: "Validation error or email already registered",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Email already registered" },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        msg: { type: "string", example: "Weight is required" },
                        path: { type: "string", example: "weight" },
                      },
                    },
                  },
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
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string", format: "email" },
                      role: { type: "string", nullable: true },
                      dailyGoal: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Invalid email or password" },
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
};

export default authPaths;
