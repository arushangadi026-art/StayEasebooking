import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import { initializeDataStore } from './services/seedData.ts';
import { generateAllWordDocsToDisk } from './services/wordDocs.ts';

import authRoutes from './routes/auth.ts';
import hotelsRoutes from './routes/hotels.ts';
import roomsRoutes from './routes/rooms.ts';
import bookingsRoutes from './routes/bookings.ts';
import reviewsRoutes from './routes/reviews.ts';
import contactRoutes from './routes/contact.ts';
import eventsRoutes from './routes/events.ts';
import adminRoutes from './routes/admin.ts';
import labsRoutes from './routes/labs.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  // 1. Initialize persistent JSON files (non-destructive on restarts)
  await initializeDataStore();

  // 2. Generate academic Word (.docx) files into /docs
  await generateAllWordDocsToDisk().catch((err) => {
    console.error('[Docs] Warning: could not pre-write Word docs:', err);
  });

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  /**
   * LAB 5: Built-in Node.js HTTP Server HTML Response Demonstration
   * Demonstrates Request & Response handling, Content-Type: text/html header,
   * and live server current date and time.
   */
  app.get('/lab5-http-server', (req, res) => {
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Kolkata',
    });

    const escapeHtml = (input: string) =>
      input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeMethod = escapeHtml(req.method || 'GET');
    const safeUrl = escapeHtml(req.originalUrl || req.url || '/lab5-http-server');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>STAYEASE — Lab 5 Node.js HTTP Server Response</title>
    <style>
      body { font-family: Georgia, serif; background: #FAF6F0; color: #2D1D14; margin: 0; padding: 48px 20px; }
      .card { max-width: 720px; margin: 0 auto; background: #FFFDF9; border: 1px solid #E4D7C5; border-radius: 16px; padding: 36px; box-shadow: 0 12px 32px rgba(45,29,20,0.06); }
      .kicker { font-family: system-ui, sans-serif; font-size: 13px; letter-spacing: 0.08em; color: #A66A38; font-weight: 600; margin-bottom: 8px; }
      h1 { margin: 0 0 12px; font-size: 32px; color: #2D1D14; }
      p { font-family: system-ui, sans-serif; line-height: 1.65; color: #4A3426; }
      .meta { margin-top: 24px; padding: 18px 20px; background: #F2EAE0; border-radius: 12px; font-family: ui-monospace, monospace; font-size: 14px; color: #2D1D14; }
      .meta div { margin: 6px 0; }
      a.btn { display: inline-block; margin-top: 24px; padding: 12px 22px; background: #2D1D14; color: #FAF6F0; text-decoration: none; border-radius: 10px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600; }
      a.btn:hover { background: #4A3426; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="kicker">LAB 5 — NODE.JS BUILT-IN HTTP MODULE</div>
      <h1>STAYEASE HTTP Server Active</h1>
      <p>
        This HTML document is served directly through Node.js's built-in <code>http.createServer()</code>
        instance with an explicit <code>Content-Type: text/html; charset=utf-8</code> header.
      </p>
      <div class="meta">
        <div><strong>Current Server Date &amp; Time (IST):</strong> ${escapeHtml(formattedDateTime)}</div>
        <div><strong>HTTP Method:</strong> ${safeMethod}</div>
        <div><strong>Request URL:</strong> ${safeUrl}</div>
        <div><strong>Node.js Runtime:</strong> ${escapeHtml(process.version)}</div>
        <div><strong>Content-Type Header:</strong> text/html; charset=utf-8</div>
      </div>
      <a class="btn" href="/">Return to STAYEASE Application</a>
    </div>
  </body>
</html>`);
  });

  // 3. Mount REST API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', hotelsRoutes);
  app.use('/api/rooms', roomsRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', labsRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'STAYEASE', serverTime: new Date().toISOString() });
  });

  // 4. Serve standalone Bootstrap 5 Lab pages (/lab7-register.html, /lab8-events.html)
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Serve generated hospitality images reliably
  const assetsDir = path.resolve(process.cwd(), 'src/assets');
  app.use('/src/assets', express.static(assetsDir));

  // 5. Vite middleware in dev OR static dist in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // LAB 5: Create server explicitly via Node.js built-in http module
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[STAYEASE] HTTP Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[STAYEASE] Fatal server startup error:', err);
  process.exit(1);
});
