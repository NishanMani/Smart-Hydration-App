import swaggerJSDoc from 'swagger-jsdoc';
import definition from './definition.js';
import paths from './paths/index.js';

const options = {
  definition: {
    ...definition,
    paths,
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerSpec };
