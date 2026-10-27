import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

connectDB()
  .then(() => {
    app.listen(env.PORT, () => console.log(`CattleCare server running on port ${env.PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });