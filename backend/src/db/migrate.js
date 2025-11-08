"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const migrator_1 = require("drizzle-orm/mysql2/migrator");
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const runMigrations = async () => {
    logger_1.logger.info('Starting database migration...');
    try {
        // The migrations folder is now correctly specified in drizzle.config.ts
        // and this script will run migrations from there.
        await (0, migrator_1.migrate)(connection_1.db, { migrationsFolder: path_1.default.resolve(__dirname, 'migrations') });
        logger_1.logger.info('Migrations applied successfully!');
    }
    catch (error) {
        logger_1.logger.error('Error applying migrations:', error);
        process.exit(1);
    }
    finally {
        if (connection_1.connection) {
            await connection_1.connection.end();
            logger_1.logger.info('Database connection closed.');
        }
    }
};
runMigrations();
