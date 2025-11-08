"use strict";
/**
 * Enhanced Database Migration Manager for RevEd Kids Backend
 * Provides rollback capabilities, validation, and safe schema changes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationManager = exports.disconnectDatabase = exports.connectDatabase = exports.MigrationManager = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const mysql_core_1 = require("drizzle-orm/mysql-core");
const schema = __importStar(require("./schema"));
// Migration metadata table
const migrations = (0, mysql_core_1.mysqlTable)('migrations', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    filename: (0, mysql_core_1.varchar)('filename', { length: 255 }).notNull().unique(),
    version: (0, mysql_core_1.varchar)('version', { length: 20 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    checksum: (0, mysql_core_1.varchar)('checksum', { length: 64 }).notNull(),
    executedAt: (0, mysql_core_1.timestamp)('executed_at').notNull().defaultNow(),
    executionTime: (0, mysql_core_1.int)('execution_time').notNull(), // in milliseconds
    rollbackSql: (0, mysql_core_1.text)('rollback_sql'),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).notNull().default('completed'),
    error: (0, mysql_core_1.text)('error'),
});
class MigrationManager {
    constructor(migrationDir = path_1.default.join(__dirname, 'migrations')) {
        this.isInitialized = false;
        this.migrationDir = migrationDir;
    }
    /**
     * Legacy method for compatibility
     */
    async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');
            await this.initialize();
            const result = await this.migrate();
            if (result.success) {
                console.log('✅ Migrations completed successfully');
            }
            else {
                throw new Error(`Migration failed: ${result.failed} failed migrations`);
            }
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
    /**
     * Legacy method for compatibility
     */
    async checkMigrationStatus() {
        try {
            // Check if core tables exist
            await connection_1.db.select().from(schema.students).limit(1);
            await connection_1.db.select().from(schema.modules).limit(1);
            await connection_1.db.select().from(schema.exercises).limit(1);
            console.log('✅ Database schema is ready');
            return true;
        }
        catch (error) {
            console.log('⚠️  Database schema not found or incomplete');
            return false;
        }
    }
    /**
     * Initialize migration system
     */
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Create migrations table if it doesn't exist
            await connection_1.connection.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          version VARCHAR(20) NOT NULL,
          description TEXT,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          execution_time INT NOT NULL,
          rollback_sql TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'completed',
          error TEXT,
          INDEX idx_migrations_version (version),
          INDEX idx_migrations_executed_at (executed_at),
          INDEX idx_migrations_status (status)
        )
      `);
            this.isInitialized = true;
            logger_1.logger.info('Migration system initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize migration system', { error });
            throw error;
        }
    }
    /**
     * Load migration files from disk
     */
    async loadMigrationFiles() {
        try {
            if (!(0, fs_1.existsSync)(this.migrationDir)) {
                logger_1.logger.warn('Migration directory does not exist', { dir: this.migrationDir });
                return [];
            }
            const files = await (0, promises_1.readdir)(this.migrationDir);
            const migrationFiles = files
                .filter(file => file.endsWith('.sql'))
                .sort(); // Ensure consistent ordering
            const migrations = [];
            for (const file of migrationFiles) {
                const filePath = path_1.default.join(this.migrationDir, file);
                const content = await (0, promises_1.readFile)(filePath, 'utf-8');
                const migration = this.parseMigrationFile(file, content);
                if (migration) {
                    migrations.push(migration);
                }
            }
            return migrations;
        }
        catch (error) {
            logger_1.logger.error('Failed to load migration files', { error });
            throw error;
        }
    }
    /**
     * Parse migration file content
     */
    parseMigrationFile(filename, content) {
        try {
            // Extract metadata from comments
            const versionMatch = content.match(/-- Version: (.+)/);
            const descriptionMatch = content.match(/-- Description: (.+)/);
            // For files without explicit version/description, generate from filename
            const version = versionMatch ? versionMatch[1].trim() : filename.replace('.sql', '');
            const description = descriptionMatch ? descriptionMatch[1].trim() : `Migration ${filename}`;
            // Split migration into UP and DOWN sections
            const sections = content.split(/-- === (UP|DOWN) ===/);
            let up = '';
            let down = '';
            if (sections.length >= 3) {
                const upIndex = sections.findIndex(section => section.trim() === 'UP') + 1;
                const downIndex = sections.findIndex(section => section.trim() === 'DOWN') + 1;
                up = upIndex > 0 && upIndex < sections.length ? sections[upIndex].trim() : '';
                down = downIndex > 0 && downIndex < sections.length ? sections[downIndex].trim() : '';
            }
            else {
                // If no UP/DOWN sections, treat entire content as UP
                up = content;
                down = '-- No rollback SQL provided';
            }
            // Generate checksum
            const checksum = this.generateChecksum(content);
            return {
                filename,
                version,
                description,
                up,
                down,
                checksum,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse migration file', { filename, error });
            return null;
        }
    }
    /**
     * Generate checksum for migration content
     */
    generateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    /**
     * Get applied migrations from database
     */
    async getAppliedMigrations() {
        try {
            const [rows] = await connection_1.connection.execute('SELECT filename FROM migrations WHERE status = ? ORDER BY executed_at ASC', ['completed']);
            return rows.map((row) => row.filename);
        }
        catch (error) {
            logger_1.logger.error('Failed to get applied migrations', { error });
            throw error;
        }
    }
    /**
     * Get pending migrations
     */
    async getPendingMigrations() {
        await this.initialize();
        const allMigrations = await this.loadMigrationFiles();
        const appliedMigrations = await this.getAppliedMigrations();
        return allMigrations.filter(migration => !appliedMigrations.includes(migration.filename));
    }
    /**
     * Execute a single migration
     */
    async executeMigration(migration) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Executing migration', {
                filename: migration.filename,
                version: migration.version,
                description: migration.description
            });
            // Execute migration in a transaction
            const conn = await connection_1.connection.getConnection();
            try {
                await conn.beginTransaction();
                // Execute UP statements
                const statements = this.splitSqlStatements(migration.up);
                for (const statement of statements) {
                    if (statement.trim()) {
                        await conn.execute(statement);
                    }
                }
                // Record migration in database
                await conn.execute(`INSERT INTO migrations 
           (filename, version, description, checksum, execution_time, rollback_sql, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    migration.filename,
                    migration.version,
                    migration.description,
                    migration.checksum,
                    Date.now() - startTime,
                    migration.down,
                    'completed'
                ]);
                await conn.commit();
                const executionTime = Date.now() - startTime;
                logger_1.logger.info('Migration executed successfully', {
                    filename: migration.filename,
                    executionTime
                });
                return { success: true, executionTime };
            }
            catch (error) {
                await conn.rollback();
                throw error;
            }
            finally {
                conn.release();
            }
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Migration execution failed', {
                filename: migration.filename,
                error: errorMessage,
                executionTime
            });
            return { success: false, executionTime, error: errorMessage };
        }
    }
    /**
     * Split SQL content into individual statements
     */
    splitSqlStatements(sql) {
        return sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'));
    }
    /**
     * Run pending migrations
     */
    async migrate() {
        await this.initialize();
        const pendingMigrations = await this.getPendingMigrations();
        if (pendingMigrations.length === 0) {
            logger_1.logger.info('No pending migrations');
            return { success: true, executed: 0, failed: 0, results: [] };
        }
        logger_1.logger.info('Starting migration process', {
            pendingCount: pendingMigrations.length
        });
        const results = [];
        let executed = 0;
        let failed = 0;
        for (const migration of pendingMigrations) {
            const result = await this.executeMigration(migration);
            results.push(result);
            if (result.success) {
                executed++;
            }
            else {
                failed++;
                // Stop on first failure to prevent cascade issues
                logger_1.logger.error('Stopping migration process due to failure');
                break;
            }
        }
        const overallSuccess = failed === 0;
        logger_1.logger.info('Migration process completed', {
            success: overallSuccess,
            executed,
            failed,
            totalPending: pendingMigrations.length
        });
        return { success: overallSuccess, executed, failed, results };
    }
    /**
     * Rollback migrations
     */
    async rollback(options = {}) {
        await this.initialize();
        const { steps = 1, toVersion, dryRun = false } = options;
        try {
            // Get migrations to rollback
            let query = 'SELECT * FROM migrations WHERE status = ? ORDER BY executed_at DESC';
            const params = ['completed'];
            if (toVersion) {
                query += ' AND version >= ?';
                params.push(toVersion);
            }
            if (steps > 0 && !toVersion) {
                query += ' LIMIT ?';
                params.push(steps);
            }
            const [rows] = await connection_1.connection.execute(query, params);
            if (rows.length === 0) {
                logger_1.logger.info('No migrations to rollback');
                return { success: true, rolledBack: 0, failed: 0 };
            }
            logger_1.logger.info('Starting rollback process', {
                migrationsToRollback: rows.length,
                dryRun
            });
            if (dryRun) {
                logger_1.logger.info('Dry run - would rollback:', {
                    migrations: rows.map((row) => ({
                        filename: row.filename,
                        version: row.version,
                        description: row.description
                    }))
                });
                return { success: true, rolledBack: rows.length, failed: 0 };
            }
            let rolledBack = 0;
            let failed = 0;
            for (const row of rows) {
                try {
                    await this.rollbackMigration(row);
                    rolledBack++;
                }
                catch (error) {
                    failed++;
                    logger_1.logger.error('Rollback failed for migration', {
                        filename: row.filename,
                        error
                    });
                    break; // Stop on first failure
                }
            }
            return { success: failed === 0, rolledBack, failed };
        }
        catch (error) {
            logger_1.logger.error('Rollback process failed', { error });
            throw error;
        }
    }
    /**
     * Rollback a single migration
     */
    async rollbackMigration(migrationRecord) {
        const conn = await connection_1.connection.getConnection();
        try {
            await conn.beginTransaction();
            logger_1.logger.info('Rolling back migration', {
                filename: migrationRecord.filename,
                version: migrationRecord.version
            });
            if (!migrationRecord.rollback_sql || migrationRecord.rollback_sql.trim() === '') {
                throw new Error('No rollback SQL available for migration');
            }
            // Execute rollback statements
            const statements = this.splitSqlStatements(migrationRecord.rollback_sql);
            for (const statement of statements) {
                if (statement.trim()) {
                    await conn.execute(statement);
                }
            }
            // Remove migration record
            await conn.execute('DELETE FROM migrations WHERE id = ?', [migrationRecord.id]);
            await conn.commit();
            logger_1.logger.info('Migration rolled back successfully', {
                filename: migrationRecord.filename
            });
        }
        catch (error) {
            await conn.rollback();
            throw error;
        }
        finally {
            conn.release();
        }
    }
    /**
     * Get migration status
     */
    async getStatus() {
        await this.initialize();
        const [appliedMigrations, pendingMigrations] = await Promise.all([
            this.getAppliedMigrationDetails(),
            this.getPendingMigrations()
        ]);
        return {
            appliedCount: appliedMigrations.length,
            pendingCount: pendingMigrations.length,
            lastMigration: appliedMigrations[0]?.filename || null,
            appliedMigrations,
            pendingMigrations: pendingMigrations.map(m => m.filename)
        };
    }
    /**
     * Get detailed applied migration information
     */
    async getAppliedMigrationDetails() {
        const [rows] = await connection_1.connection.execute(`
      SELECT filename, version, description, executed_at, execution_time 
      FROM migrations 
      WHERE status = 'completed'
      ORDER BY executed_at DESC
    `);
        return rows.map((row) => ({
            filename: row.filename,
            version: row.version,
            description: row.description,
            executedAt: new Date(row.executed_at),
            executionTime: row.execution_time
        }));
    }
    /**
     * Legacy methods for compatibility
     */
    async createTables() {
        logger_1.logger.info('Tables creation handled by migration system');
    }
    async dropTables() {
        try {
            logger_1.logger.info('Dropping all tables...');
            // This should be handled through rollback migrations instead
            logger_1.logger.warn('Use migration rollback instead of dropTables for safer operations');
        }
        catch (error) {
            logger_1.logger.error('Error dropping tables:', error);
            throw error;
        }
    }
}
exports.MigrationManager = MigrationManager;
// Helper functions for backward compatibility
async function connectDatabase() {
    const migrationManager = new MigrationManager();
    await migrationManager.runMigrations();
}
exports.connectDatabase = connectDatabase;
async function disconnectDatabase() {
    logger_1.logger.info('Disconnecting from database...');
    // Connection pool cleanup is handled automatically by mysql2
}
exports.disconnectDatabase = disconnectDatabase;
// Create and export singleton instance
exports.migrationManager = new MigrationManager();
