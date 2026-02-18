import components from './components.js';
import tags from './tags.js';

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Hydration API',
    version: '1.0.0',
    description: 'API documentation for Smart Hydration backend.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
  tags,
  components,
};

export default definition;
