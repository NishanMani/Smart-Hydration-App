const components = {
  schemas: {},
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
};

export default components; 

//Components (components.js)

// Stores reusable schemas, like User, Reminder, WaterLog.

// Can also include security schemes like bearer auth.