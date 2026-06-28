/**
 * Vercel serverless function — Sarvam proxy only.
 *
 * Deliberately isolated from server/index.js. That file unconditionally
 * runs initDB() (better-sqlite3, needs a writable file — Vercel's fs is
 * read-only outside /tmp) and createRealtimeServer() (socket.io, needs a
 * persistent connection — incompatible with serverless) at module load
 * time. Lifting the whole Express app would crash on cold start before
 * any route runs. Sarvam's routes have no DB/socket dependency, so they're
 * extracted here standalone.
 *
 * Routes: POST /api/sarvam/speech-to-text, /text-to-speech,
 *         /text-to-speech-stream, /translate, /tts-bridge,
 *         /tts-stream-bridge, /batch-translate, GET /status
 */
import express from 'express';
import cors from 'cors';
import sarvamRoutes from '../server/routes/sarvam.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/sarvam', sarvamRoutes);

export default app;
