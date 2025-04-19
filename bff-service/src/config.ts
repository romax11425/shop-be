import dotenv from 'dotenv';
import { ServiceConfig } from './types';

dotenv.config();

export const CACHE_TTL = parseInt(process.env.CACHE_TTL || '120000', 10);

export const serviceUrls: ServiceConfig = {
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:3002',
  import: process.env.IMPORT_SERVICE_URL || 'http://localhost:3003'
};

export const validateConfig = () => {
  const required = ['PRODUCT_SERVICE_URL', 'CART_SERVICE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const getServiceUrl = (serviceName: string): string => {
  const url = serviceUrls[serviceName.toLowerCase()];
  if (!url) {
    throw new Error(`Service URL not found for ${serviceName}`);
  }
  return url;
};

// Initialize config validation
validateConfig();
