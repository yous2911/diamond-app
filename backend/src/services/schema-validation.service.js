"use strict";
/**
 * Database Schema Validation Service for RevEd Kids
 * Provides comprehensive schema validation, drift detection, and consistency checks
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaValidationService = void 0;
const connection_1 = require("../db/connection");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const { join } = path;
const cron = __importStar(require("node-cron"));
class SchemaValidationService {
    constructor() {
        this.expectedSchema = null;
        this.currentSchema = null;
        this.validationHistory = [];
        this.driftHistory = [];
        this.scheduledTasks = new Map();
        this.isInitialized = false;
        this.schemaPath = process.env.SCHEMA_DEFINITION_PATH ||
            join(process.cwd(), 'backend', 'src', 'db', 'schema-definition.json');
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing schema validation service...');
            // Load expected schema definition
            await this.loadExpectedSchema();
            // Generate current schema if not exists
            await this.generateCurrentSchema();
            // Setup scheduled validation
            this.setupScheduledValidation();
            // Setup drift monitoring
            this.setupDriftMonitoring();
            this.isInitialized = true;
            logger_1.logger.info('Schema validation service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize schema validation service', { error });
            throw error;
        }
    }
    async loadExpectedSchema() {
        try {
            if (await this.fileExists(this.schemaPath)) {
                const content = await fs.readFile(this.schemaPath, 'utf8');
                this.expectedSchema = JSON.parse(content);
                logger_1.logger.info('Expected schema loaded', {
                    version: this.expectedSchema?.version,
                    tables: this.expectedSchema?.tables.length
                });
            }
            else {
                logger_1.logger.warn('Schema definition file not found, generating from current database...');
                await this.generateSchemaDefinition();
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load expected schema', { error });
            throw error;
        }
    }
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async generateSchemaDefinition() {
        try {
            logger_1.logger.info('Generating schema definition from current database...');
            const schema = {
                version: '1.0.0',
                tables: await this.extractTables(),
                indexes: await this.extractIndexes(),
                constraints: await this.extractConstraints(),
                triggers: await this.extractTriggers(),
                procedures: await this.extractProcedures(),
                metadata: {
                    createdAt: new Date(),
                    description: 'Auto-generated schema definition for RevEd Kids database',
                    author: 'Schema Validation Service'
                }
            };
            // Save schema definition
            await this.ensureDirectoryExists(this.schemaPath);
            await fs.writeFile(this.schemaPath, JSON.stringify(schema, null, 2));
            this.expectedSchema = schema;
            logger_1.logger.info('Schema definition generated and saved', {
                version: schema.version,
                tables: schema.tables.length,
                indexes: schema.indexes.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to generate schema definition', { error });
            throw error;
        }
    }
    async ensureDirectoryExists(filePath) {
        const dir = require('path').dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }
    async extractTables() {
        const tables = [];
        // Get all tables
        const [tableRows] = await connection_1.connection.execute(`
      SELECT 
        TABLE_NAME, 
        ENGINE, 
        TABLE_COLLATION,
        TABLE_COMMENT
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
        for (const tableRow of tableRows) {
            const tableName = tableRow.TABLE_NAME;
            // Get columns for this table
            const columns = await this.extractTableColumns(tableName);
            // Get primary key
            const primaryKey = await this.extractPrimaryKey(tableName);
            const charset = tableRow.TABLE_COLLATION?.split('_')[0] || 'utf8mb4';
            tables.push({
                name: tableName,
                columns,
                primaryKey,
                engine: tableRow.ENGINE || 'InnoDB',
                charset,
                collation: tableRow.TABLE_COLLATION || 'utf8mb4_unicode_ci',
                comment: tableRow.TABLE_COMMENT || undefined
            });
        }
        return tables;
    }
    async extractTableColumns(tableName) {
        const [columnRows] = await connection_1.connection.execute(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        EXTRA,
        COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
        return columnRows.map(row => ({
            name: row.COLUMN_NAME,
            type: row.COLUMN_TYPE,
            nullable: row.IS_NULLABLE === 'YES',
            defaultValue: row.COLUMN_DEFAULT,
            autoIncrement: row.EXTRA.includes('auto_increment'),
            comment: row.COLUMN_COMMENT || undefined,
            extra: row.EXTRA || undefined
        }));
    }
    async extractPrimaryKey(tableName) {
        const [pkRows] = await connection_1.connection.execute(`
      SELECT COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = 'PRIMARY'
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
        return pkRows.map(row => row.COLUMN_NAME);
    }
    async extractIndexes() {
        const indexes = [];
        const indexMap = new Map();
        const [indexRows] = await connection_1.connection.execute(`
      SELECT 
        INDEX_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        INDEX_TYPE,
        SEQ_IN_INDEX
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);
        for (const row of indexRows) {
            const key = `${row.TABLE_NAME}.${row.INDEX_NAME}`;
            if (!indexMap.has(key)) {
                indexMap.set(key, {
                    name: row.INDEX_NAME,
                    tableName: row.TABLE_NAME,
                    columns: [],
                    type: row.NON_UNIQUE === 0 ? 'UNIQUE' :
                        row.INDEX_TYPE === 'FULLTEXT' ? 'FULLTEXT' : 'INDEX',
                    method: row.INDEX_TYPE === 'BTREE' ? 'BTREE' :
                        row.INDEX_TYPE === 'HASH' ? 'HASH' : undefined
                });
            }
            indexMap.get(key).columns.push(row.COLUMN_NAME);
        }
        return Array.from(indexMap.values());
    }
    async extractConstraints() {
        const constraints = [];
        // Foreign key constraints
        const [fkRows] = await connection_1.connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      WHERE kcu.TABLE_SCHEMA = DATABASE()
      AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    `);
        for (const row of fkRows) {
            constraints.push({
                name: row.CONSTRAINT_NAME,
                tableName: row.TABLE_NAME,
                type: 'FOREIGN KEY',
                columns: [row.COLUMN_NAME],
                referencedTable: row.REFERENCED_TABLE_NAME,
                referencedColumns: [row.REFERENCED_COLUMN_NAME],
                onDelete: row.DELETE_RULE,
                onUpdate: row.UPDATE_RULE
            });
        }
        return constraints;
    }
    async extractTriggers() {
        const triggers = [];
        try {
            const [triggerRows] = await connection_1.connection.execute(`
        SELECT 
          TRIGGER_NAME,
          EVENT_MANIPULATION,
          ACTION_TIMING,
          EVENT_OBJECT_TABLE,
          ACTION_STATEMENT
        FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
      `);
            for (const row of triggerRows) {
                triggers.push({
                    name: row.TRIGGER_NAME,
                    tableName: row.EVENT_OBJECT_TABLE,
                    timing: row.ACTION_TIMING,
                    event: row.EVENT_MANIPULATION,
                    body: row.ACTION_STATEMENT
                });
            }
        }
        catch (error) {
            logger_1.logger.debug('Could not extract triggers', { error: error.message });
        }
        return triggers;
    }
    async extractProcedures() {
        const procedures = [];
        try {
            const [procRows] = await connection_1.connection.execute(`
        SELECT 
          ROUTINE_NAME,
          ROUTINE_BODY,
          ROUTINE_DEFINITION,
          DATA_TYPE as RETURN_TYPE,
          ROUTINE_COMMENT
        FROM information_schema.ROUTINES
        WHERE ROUTINE_SCHEMA = DATABASE()
        AND ROUTINE_TYPE = 'PROCEDURE'
      `);
            for (const row of procRows) {
                // Get parameters for this procedure
                const parameters = await this.extractProcedureParameters(row.ROUTINE_NAME);
                procedures.push({
                    name: row.ROUTINE_NAME,
                    parameters,
                    body: row.ROUTINE_DEFINITION,
                    returnType: row.RETURN_TYPE,
                    comment: row.ROUTINE_COMMENT
                });
            }
        }
        catch (error) {
            logger_1.logger.debug('Could not extract procedures', { error: error.message });
        }
        return procedures;
    }
    async extractProcedureParameters(procedureName) {
        try {
            const [paramRows] = await connection_1.connection.execute(`
        SELECT 
          PARAMETER_NAME,
          DATA_TYPE,
          PARAMETER_MODE
        FROM information_schema.PARAMETERS
        WHERE SPECIFIC_SCHEMA = DATABASE()
        AND SPECIFIC_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [procedureName]);
            return paramRows.map(row => ({
                name: row.PARAMETER_NAME,
                type: row.DATA_TYPE,
                direction: row.PARAMETER_MODE || 'IN'
            }));
        }
        catch (error) {
            return [];
        }
    }
    async generateCurrentSchema() {
        this.currentSchema = {
            version: 'current',
            tables: await this.extractTables(),
            indexes: await this.extractIndexes(),
            constraints: await this.extractConstraints(),
            triggers: await this.extractTriggers(),
            procedures: await this.extractProcedures(),
            metadata: {
                createdAt: new Date(),
                description: 'Current database schema snapshot',
                author: 'Schema Validation Service'
            }
        };
    }
    async validateSchema() {
        const startTime = Date.now();
        try {
            if (!this.expectedSchema) {
                throw new Error('Expected schema not loaded');
            }
            logger_1.logger.info('Starting schema validation...');
            await this.generateCurrentSchema();
            const errors = [];
            const warnings = [];
            // Validate tables
            await this.validateTables(errors, warnings);
            // Validate indexes
            await this.validateIndexes(errors, warnings);
            // Validate constraints
            await this.validateConstraints(errors, warnings);
            // Validate triggers
            await this.validateTriggers(errors, warnings);
            // Validate procedures
            await this.validateProcedures(errors, warnings);
            const executionTime = Date.now() - startTime;
            const result = {
                isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
                errors,
                warnings,
                summary: {
                    tablesChecked: this.expectedSchema.tables.length,
                    indexesChecked: this.expectedSchema.indexes.length,
                    constraintsChecked: this.expectedSchema.constraints.length,
                    errorsFound: errors.length,
                    warningsFound: warnings.length
                },
                executionTime
            };
            this.validationHistory.push(result);
            // Keep only last 50 validations
            if (this.validationHistory.length > 50) {
                this.validationHistory = this.validationHistory.slice(-50);
            }
            logger_1.logger.info('Schema validation completed', {
                isValid: result.isValid,
                errors: result.errors.length,
                warnings: result.warnings.length,
                executionTime
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Schema validation failed', { error });
            throw error;
        }
    }
    async validateTables(errors, warnings) {
        if (!this.expectedSchema || !this.currentSchema)
            return;
        for (const expectedTable of this.expectedSchema.tables) {
            const currentTable = this.currentSchema.tables.find(t => t.name === expectedTable.name);
            if (!currentTable) {
                errors.push({
                    type: 'MISSING_TABLE',
                    severity: 'critical',
                    message: `Table '${expectedTable.name}' is missing`,
                    table: expectedTable.name,
                    suggestedFix: `CREATE TABLE ${expectedTable.name}`
                });
                continue;
            }
            // Validate columns
            await this.validateTableColumns(expectedTable, currentTable, errors, warnings);
            // Validate table properties
            if (expectedTable.engine !== currentTable.engine) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Table '${expectedTable.name}' has different engine`,
                    table: expectedTable.name,
                    suggestion: `Expected: ${expectedTable.engine}, Found: ${currentTable.engine}`
                });
            }
            if (expectedTable.charset !== currentTable.charset) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Table '${expectedTable.name}' has different charset`,
                    table: expectedTable.name,
                    suggestion: `Expected: ${expectedTable.charset}, Found: ${currentTable.charset}`
                });
            }
        }
        // Check for extra tables
        for (const currentTable of this.currentSchema.tables) {
            const expectedTable = this.expectedSchema.tables.find(t => t.name === currentTable.name);
            if (!expectedTable) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Unexpected table '${currentTable.name}' found`,
                    table: currentTable.name,
                    suggestion: 'Verify if this table should be part of the schema'
                });
            }
        }
    }
    async validateTableColumns(expectedTable, currentTable, errors, warnings) {
        for (const expectedColumn of expectedTable.columns) {
            const currentColumn = currentTable.columns.find(c => c.name === expectedColumn.name);
            if (!currentColumn) {
                errors.push({
                    type: 'MISSING_COLUMN',
                    severity: 'high',
                    message: `Column '${expectedColumn.name}' is missing in table '${expectedTable.name}'`,
                    table: expectedTable.name,
                    column: expectedColumn.name,
                    suggestedFix: `ALTER TABLE ${expectedTable.name} ADD COLUMN ${expectedColumn.name} ${expectedColumn.type}`
                });
                continue;
            }
            // Validate column type
            if (expectedColumn.type !== currentColumn.type) {
                errors.push({
                    type: 'TYPE_MISMATCH',
                    severity: 'medium',
                    message: `Column '${expectedColumn.name}' in table '${expectedTable.name}' has wrong type`,
                    table: expectedTable.name,
                    column: expectedColumn.name,
                    expected: expectedColumn.type,
                    actual: currentColumn.type,
                    suggestedFix: `ALTER TABLE ${expectedTable.name} MODIFY COLUMN ${expectedColumn.name} ${expectedColumn.type}`
                });
            }
            // Validate nullable
            if (expectedColumn.nullable !== currentColumn.nullable) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Column '${expectedColumn.name}' in table '${expectedTable.name}' has different nullability`,
                    table: expectedTable.name,
                    column: expectedColumn.name,
                    suggestion: `Expected: ${expectedColumn.nullable ? 'NULL' : 'NOT NULL'}, Found: ${currentColumn.nullable ? 'NULL' : 'NOT NULL'}`
                });
            }
        }
    }
    async validateIndexes(errors, warnings) {
        if (!this.expectedSchema || !this.currentSchema)
            return;
        for (const expectedIndex of this.expectedSchema.indexes) {
            const currentIndex = this.currentSchema.indexes.find(i => i.name === expectedIndex.name && i.tableName === expectedIndex.tableName);
            if (!currentIndex) {
                errors.push({
                    type: 'MISSING_INDEX',
                    severity: 'medium',
                    message: `Index '${expectedIndex.name}' is missing on table '${expectedIndex.tableName}'`,
                    table: expectedIndex.tableName,
                    suggestedFix: `CREATE INDEX ${expectedIndex.name} ON ${expectedIndex.tableName} (${expectedIndex.columns.join(', ')})`
                });
                continue;
            }
            // Validate index columns
            if (JSON.stringify(expectedIndex.columns) !== JSON.stringify(currentIndex.columns)) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Index '${expectedIndex.name}' has different columns`,
                    table: expectedIndex.tableName,
                    suggestion: `Expected: [${expectedIndex.columns.join(', ')}], Found: [${currentIndex.columns.join(', ')}]`
                });
            }
        }
    }
    async validateConstraints(errors, warnings) {
        if (!this.expectedSchema || !this.currentSchema)
            return;
        for (const expectedConstraint of this.expectedSchema.constraints) {
            const currentConstraint = this.currentSchema.constraints.find(c => c.name === expectedConstraint.name && c.tableName === expectedConstraint.tableName);
            if (!currentConstraint) {
                errors.push({
                    type: 'MISSING_CONSTRAINT',
                    severity: 'high',
                    message: `Constraint '${expectedConstraint.name}' is missing on table '${expectedConstraint.tableName}'`,
                    table: expectedConstraint.tableName
                });
            }
        }
    }
    async validateTriggers(errors, warnings) {
        if (!this.expectedSchema || !this.currentSchema)
            return;
        for (const expectedTrigger of this.expectedSchema.triggers) {
            const currentTrigger = this.currentSchema.triggers.find(t => t.name === expectedTrigger.name && t.tableName === expectedTrigger.tableName);
            if (!currentTrigger) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Trigger '${expectedTrigger.name}' is missing on table '${expectedTrigger.tableName}'`,
                    table: expectedTrigger.tableName
                });
            }
        }
    }
    async validateProcedures(errors, warnings) {
        if (!this.expectedSchema || !this.currentSchema)
            return;
        for (const expectedProcedure of this.expectedSchema.procedures) {
            const currentProcedure = this.currentSchema.procedures.find(p => p.name === expectedProcedure.name);
            if (!currentProcedure) {
                warnings.push({
                    type: 'PERFORMANCE_CONCERN',
                    message: `Procedure '${expectedProcedure.name}' is missing`,
                    suggestion: 'Verify if this procedure is still needed'
                });
            }
        }
    }
    async detectSchemaDrift() {
        const drifts = [];
        if (!this.expectedSchema || !this.currentSchema) {
            return drifts;
        }
        // Compare table structures
        for (const expectedTable of this.expectedSchema.tables) {
            const currentTable = this.currentSchema.tables.find(t => t.name === expectedTable.name);
            if (!currentTable)
                continue;
            // Check for column changes
            const expectedColumnNames = expectedTable.columns.map(c => c.name);
            const currentColumnNames = currentTable.columns.map(c => c.name);
            // Added columns
            const addedColumns = currentColumnNames.filter(name => !expectedColumnNames.includes(name));
            for (const columnName of addedColumns) {
                drifts.push({
                    tableName: expectedTable.name,
                    driftType: 'COLUMN_ADDED',
                    description: `Column '${columnName}' was added to table '${expectedTable.name}'`,
                    detectedAt: new Date(),
                    severity: 'info'
                });
            }
            // Removed columns
            const removedColumns = expectedColumnNames.filter(name => !currentColumnNames.includes(name));
            for (const columnName of removedColumns) {
                drifts.push({
                    tableName: expectedTable.name,
                    driftType: 'COLUMN_REMOVED',
                    description: `Column '${columnName}' was removed from table '${expectedTable.name}'`,
                    detectedAt: new Date(),
                    severity: 'warning'
                });
            }
            // Modified columns
            for (const expectedColumn of expectedTable.columns) {
                const currentColumn = currentTable.columns.find(c => c.name === expectedColumn.name);
                if (currentColumn && expectedColumn.type !== currentColumn.type) {
                    drifts.push({
                        tableName: expectedTable.name,
                        driftType: 'COLUMN_MODIFIED',
                        description: `Column '${expectedColumn.name}' type changed from '${expectedColumn.type}' to '${currentColumn.type}'`,
                        detectedAt: new Date(),
                        severity: 'warning'
                    });
                }
            }
        }
        this.driftHistory.push(...drifts);
        return drifts;
    }
    setupScheduledValidation() {
        // Daily validation at 4 AM
        const validationTask = cron.schedule('0 4 * * *', async () => {
            try {
                const result = await this.validateSchema();
                if (!result.isValid) {
                    logger_1.logger.warn('Scheduled schema validation found issues', {
                        errors: result.errors.length,
                        warnings: result.warnings.length
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Scheduled schema validation failed', { error });
            }
        }, { name: 'schema-validation' });
        this.scheduledTasks.set('validation', validationTask);
        logger_1.logger.info('Scheduled schema validation configured');
    }
    setupDriftMonitoring() {
        // Weekly drift detection on Sundays at 5 AM
        const driftTask = cron.schedule('0 5 * * 0', async () => {
            try {
                const drifts = await this.detectSchemaDrift();
                if (drifts.length > 0) {
                    logger_1.logger.warn('Schema drift detected', {
                        drifts: drifts.length,
                        tables: [...new Set(drifts.map(d => d.tableName))]
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Schema drift detection failed', { error });
            }
        }, { name: 'drift-monitoring' });
        this.scheduledTasks.set('drift', driftTask);
        logger_1.logger.info('Schema drift monitoring configured');
    }
    // Public API methods
    getValidationHistory() {
        return [...this.validationHistory];
    }
    getLatestValidationResult() {
        return this.validationHistory.length > 0
            ? this.validationHistory[this.validationHistory.length - 1]
            : null;
    }
    getDriftHistory() {
        return [...this.driftHistory];
    }
    getCurrentSchema() {
        return this.currentSchema;
    }
    getExpectedSchema() {
        return this.expectedSchema;
    }
    async updateExpectedSchema(newSchema) {
        await fs.writeFile(this.schemaPath, JSON.stringify(newSchema, null, 2));
        this.expectedSchema = newSchema;
        logger_1.logger.info('Expected schema updated', { version: newSchema.version });
    }
    async shutdown() {
        logger_1.logger.info('Shutting down schema validation service...');
        this.scheduledTasks.forEach((task, name) => {
            task.stop();
            logger_1.logger.debug(`Stopped scheduled task: ${name}`);
        });
        this.scheduledTasks.clear();
        logger_1.logger.info('Schema validation service shutdown completed');
    }
}
// Create and export singleton instance
exports.schemaValidationService = new SchemaValidationService();
exports.default = exports.schemaValidationService;
