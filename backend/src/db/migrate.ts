import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, connection } from './connection';
import { logger } from '../utils/logger';
import path from 'path';

const runMigrations = async () => {
  logger.info('Starting database migration...');
  try {
    // The migrations folder is now correctly specified in drizzle.config.ts
    // and this script will run migrations from there.
    await migrate(db, { migrationsFolder: path.resolve(__dirname, 'migrations') });

    logger.info('Migrations applied successfully!');
  } catch (error: unknown) {
    logger.error('Error applying migrations', { err: error });
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logger.info('Database connection closed.');
    }
  }
};

runMigrations();
