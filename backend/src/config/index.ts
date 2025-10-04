import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define configuration interface
interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientUrl: string;
  apiPrefix: string;
  appName: string;
  appUrl: string;
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
}

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL',
  'API_PREFIX',
  'APP_NAME',
  'APP_URL'
  // Variables de correo comentadas temporalmente para desarrollo
  // 'EMAIL_HOST',
  // 'EMAIL_PORT',
  // 'EMAIL_USER',
  // 'EMAIL_PASSWORD',
  // 'EMAIL_FROM_EMAIL',
  // 'EMAIL_FROM_NAME'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Create config object
const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: process.env.APP_NAME || 'Educa Platform',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    fromEmail: process.env.EMAIL_FROM_EMAIL || 'no-reply@educa-platform.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Educa Platform',
  },
};

// Verificar que las variables obligatorias estén configuradas
if (!config.jwtSecret || config.jwtSecret === 'your-secret-key') {
  console.warn('ADVERTENCIA: JWT_SECRET no está configurado. Usando una clave por defecto insegura.');
}

// Log environment mode
console.log(`🌐 Environment: ${config.nodeEnv}`);

export default config;
