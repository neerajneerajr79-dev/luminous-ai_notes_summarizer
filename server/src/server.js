const env = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/db');

// Starts a real mongod managed by mongodb-memory-server backed by a persistent
// data directory, so development data survives restarts without a local
// MongoDB install. Set USE_EMBEDDED_DB=false to disable.
async function startEmbeddedDb() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const path = require('path');
  const fs = require('fs');

  const dataDir = path.resolve(process.cwd(), '.data');
  fs.mkdirSync(dataDir, { recursive: true });

  console.log('Starting embedded dev MongoDB (data dir: server/.data)...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      ip: '127.0.0.1',
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
    },
  });

  // Reuse the standard URI so behavior matches a real local install.
  env.mongodbUri = 'mongodb://127.0.0.1:27017/lumio';
  console.log(`Embedded MongoDB ready at ${mongod.getUri()}`);
  return mongod;
}

(async () => {
  let mongod = null;
  if (env.nodeEnv === 'development' && process.env.USE_EMBEDDED_DB !== 'false') {
    mongod = await startEmbeddedDb();
  }

  await connectDB();
  console.log(`MongoDB connected: ${mongod ? 'embedded (127.0.0.1:27017)' : env.mongodbUri.split('@').pop()}`);

  const server = app.listen(env.port, () => {
    console.log(`Lumio AI API running on http://localhost:${env.port} (${env.nodeEnv})`);
    if (!env.ai.apiKey) {
  console.warn(
    'WARNING: GEMINI_API_KEY is not set. AI endpoints will not work until configured.'
  );
}
  });

  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      if (mongod) mongod.stop().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});
USE_EMBEDDED_DB=false