import { app } from './app';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';

async function startServer() {
  try {
    validateEnv();
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on ${env.APP_URL}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    const gracefulShutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        await disconnectRedis();
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
