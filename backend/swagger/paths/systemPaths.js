export const systemPaths = {
  "/": {
    get: {
      tags: ["System"],
      summary: "Health check",
      responses: {
        200: {
          description: "API is running",
        },
      },
    },
  },
};

export default systemPaths;
