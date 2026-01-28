import app from './app';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createServer } from 'http';
import { initSocket } from './socket/signaling';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 8000;

/* ✅ CORS MUST BE HERE (before server starts) */
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://care-connect-620kmlcyl-arunas-projects-c4191e30.vercel.app'
  ],
  credentials: true,
}));

/* ✅ DB Connection */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.connect()
  .then(() => {
    console.log('📦 Connected to PostgreSQL Database');

    const server = createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

    
