"use strict";
/**
 * Competencies Service for Educational Platform
 * Provides operations for competency management, content loading, and caching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.competenciesService = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
// Using console for logging since logger was moved to job-specific logger
const logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
};
const __dirname = path_1.default.dirname(__filename);
class CompetenciesService {
    constructor() {
        this.contentCache = new Map();
        this.contentPath = path_1.default.join(__dirname, '../../content');
    }
    /**
     * Load JSON content for a specific competency
     */
    async loadCompetencyContent(competencyCode) {
        try {
            // Check cache first
            if (this.contentCache.has(competencyCode)) {
                return this.contentCache.get(competencyCode) || null;
            }
            // Only load content for CE2 competencies for now
            if (!competencyCode.startsWith('CE2.')) {
                return null;
            }
            const parts = competencyCode.split('.');
            if (parts.length < 2) {
                logger.warn(`Invalid competency code format: ${competencyCode}`);
                return null;
            }
            const subject = parts[1]; // FR or MA
            const contentFilePath = path_1.default.join(this.contentPath, 'CE2', subject, `${competencyCode}.json`);
            try {
                const contentData = await promises_1.default.readFile(contentFilePath, 'utf8');
                const content = JSON.parse(contentData);
                // Cache the content
                this.contentCache.set(competencyCode, content);
                return content;
            }
            catch (fileError) {
                const err = fileError instanceof Error ? fileError : new Error(String(fileError));
                logger.warn(`Content file not found for ${competencyCode}:`, err.message);
                // Cache null result to avoid repeated file system calls
                this.contentCache.set(competencyCode, null);
                return null;
            }
        }
        catch (error) {
            logger.error(`Error loading content for ${competencyCode}:`, error);
            return null;
        }
    }
    /**
     * Get competencies list from database with optional filtering
     * SECURITY FIX: Uses Drizzle ORM query builder to prevent SQL injection
     */
    async getCompetenciesList(db, filters = {}) {
        try {
            const { level, subject, limit = 100, offset = 0 } = filters;
            // Build conditions using Drizzle ORM query builder (SECURE)
            let conditions = [(0, drizzle_orm_1.eq)(schema_1.competences.est_actif, 1)];
            if (level) {
                // Validate level input to prevent injection
                const validLevels = ['CP', 'CE1', 'CE2'];
                if (!validLevels.includes(level)) {
                    throw new Error('Invalid level parameter');
                }
                conditions.push((0, drizzle_orm_1.like)(schema_1.competences.code, `${level}.%`));
            }
            if (subject) {
                // Validate subject input to prevent injection
                const validSubjects = ['FR', 'MA'];
                if (!validSubjects.includes(subject)) {
                    throw new Error('Invalid subject parameter');
                }
                conditions.push((0, drizzle_orm_1.eq)(schema_1.competences.matiere, subject));
            }
            // Use Drizzle ORM query builder (SECURE)
            const query = db
                .select({
                code: schema_1.competences.code,
                nom: schema_1.competences.titre,
                matiere: schema_1.competences.matiere,
                domaine: schema_1.competences.domaine,
                description: schema_1.competences.description,
                xp_reward: (0, drizzle_orm_1.sql) `0`
            })
                .from(schema_1.competences)
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy(schema_1.competences.code)
                .limit(limit)
                .offset(offset);
            const rows = await query;
            return rows;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Error fetching competencies list:', err);
            throw new Error('Failed to fetch competencies list');
        }
    }
    /**
     * Get a single competency with content
     * SECURITY FIX: Uses Drizzle ORM query builder to prevent SQL injection
     */
    async getCompetencyWithContent(db, competencyCode) {
        try {
            // Validate competency code format first
            if (!this.validateCompetencyCode(competencyCode)) {
                throw new Error('Invalid competency code format');
            }
            // Use Drizzle ORM query builder (SECURE)
            const rows = await db
                .select({
                code: schema_1.competences.code,
                nom: schema_1.competences.titre,
                matiere: schema_1.competences.matiere,
                domaine: schema_1.competences.domaine,
                description: schema_1.competences.description,
                xp_reward: (0, drizzle_orm_1.sql) `0`
            })
                .from(schema_1.competences)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.competences.code, competencyCode), (0, drizzle_orm_1.eq)(schema_1.competences.est_actif, 1)))
                .limit(1);
            if (!rows || rows.length === 0) {
                return null;
            }
            const baseCompetency = rows[0];
            // Load content if available
            const content = await this.loadCompetencyContent(competencyCode);
            return {
                ...baseCompetency,
                content
            };
        }
        catch (error) {
            logger.error(`Error fetching competency ${competencyCode}:`, error);
            throw new Error(`Failed to fetch competency: ${competencyCode}`);
        }
    }
    /**
     * Generate cache key for competencies list
     */
    generateListCacheKey(filters) {
        const { level, subject, limit, offset } = filters;
        return `comp:list:${level || 'all'}:${subject || 'all'}:${limit || 100}:${offset || 0}`;
    }
    /**
     * Generate cache key for individual competency
     */
    generateItemCacheKey(competencyCode) {
        return `comp:item:${competencyCode}`;
    }
    /**
     * Validate competency code format
     */
    validateCompetencyCode(code) {
        // Expected format: LEVEL.SUBJECT.DOMAIN.TYPE.NUMBER (e.g., CE2.FR.L.FL.01)
        const parts = code.split('.');
        if (parts.length !== 5)
            return false;
        const [level, subject] = parts;
        const validLevels = ['CP', 'CE1', 'CE2'];
        const validSubjects = ['FR', 'MA'];
        return validLevels.includes(level) && validSubjects.includes(subject);
    }
    /**
     * Clear content cache (useful for testing or cache invalidation)
     */
    clearContentCache() {
        this.contentCache.clear();
        logger.info('Competency content cache cleared');
    }
    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.contentCache.size,
            keys: Array.from(this.contentCache.keys())
        };
    }
    /**
     * Preload content for a level (optimization for startup)
     */
    async preloadContentForLevel(level) {
        try {
            logger.info(`Preloading content for level: ${level}`);
            const levelPath = path_1.default.join(this.contentPath, level);
            try {
                await promises_1.default.access(levelPath);
            }
            catch {
                logger.warn(`Content directory not found for level: ${level}`);
                return;
            }
            const subjects = ['FR', 'MA'];
            for (const subject of subjects) {
                const subjectPath = path_1.default.join(levelPath, subject);
                try {
                    const files = await promises_1.default.readdir(subjectPath);
                    const jsonFiles = files.filter(file => file.endsWith('.json'));
                    for (const file of jsonFiles) {
                        const competencyCode = file.replace('.json', '');
                        await this.loadCompetencyContent(competencyCode);
                    }
                    logger.info(`Preloaded ${jsonFiles.length} files for ${level}.${subject}`);
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.warn(`Error preloading ${level}.${subject}:`, err.message);
                }
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`Error preloading content for level ${level}:`, err);
        }
    }
}
exports.competenciesService = new CompetenciesService();
