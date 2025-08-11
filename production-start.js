// Production start script for Render deployment
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Set production environment
process.env.NODE_ENV = 'production';

// Import and start the server
import('./dist/index.js').then(() => {
  console.log('Production server started successfully');
}).catch((error) => {
  console.error('Failed to start production server:', error);
  process.exit(1);
});