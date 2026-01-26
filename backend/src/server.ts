import app from './app';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createServer } from 'http';
import { initSocket } from './socket/signaling';

dotenv.config();

const PORT = process.env.PORT || 8000;

// DB Connection Test
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect().then(() => {
    console.log('📦 Connected to PostgreSQL Database');

    // Create HTTP Server for Socket.io + Express
    const server = createServer(app);

    // Initialize Socket.io
    initSocket(server);

    // Server started
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});
