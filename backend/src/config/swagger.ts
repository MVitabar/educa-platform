import swaggerJsdoc from 'swagger-jsdoc';
const version = '1.0.0'; // Usamos una versión fija en lugar de importar de package.json

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Educa Platform API',
      version,
      description: 'API para la plataforma educativa',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'soporte@educaplatform.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/controllers/*.ts',  // Controladores con documentación JSDoc
    './src/routes/*.ts',      // Rutas
    './src/models/*.ts'       // Modelos con esquemas
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
