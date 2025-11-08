"use strict";
// CACHE WARMING SERVICE FOR EDUCATIONAL PLATFORM
// Pre-loads critical data for optimal performance
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingService = void 0;
class CacheWarmingService {
    constructor(fastify, advancedCache) {
        this.strategies = [];
        this.isWarming = false;
        this.fastify = fastify;
        this.advancedCache = advancedCache;
        this.initializeStrategies();
    }
    initializeStrategies() {
        this.strategies = [
            {
                name: 'Core Competences',
                priority: 'critical',
                interval: 3600000, // 1 hour
                enabled: true,
                execute: this.warmCoreCompetences.bind(this)
            },
            {
                name: 'Popular Exercises',
                priority: 'critical',
                interval: 1800000, // 30 minutes
                enabled: true,
                execute: this.warmPopularExercises.bind(this)
            },
            {
                name: 'Student Progression Data',
                priority: 'important',
                interval: 900000, // 15 minutes
                enabled: true,
                execute: this.warmStudentProgressions.bind(this)
            },
            {
                name: 'Curriculum Levels',
                priority: 'critical',
                interval: 7200000, // 2 hours
                enabled: true,
                execute: this.warmCurriculumLevels.bind(this)
            },
            {
                name: 'Exercise Statistics',
                priority: 'important',
                interval: 3600000, // 1 hour
                enabled: true,
                execute: this.warmExerciseStats.bind(this)
            },
            {
                name: 'Authentication Data',
                priority: 'critical',
                interval: 1800000, // 30 minutes
                enabled: true,
                execute: this.warmAuthenticationData.bind(this)
            }
        ];
    }
    // CRITICAL: Warm core French competences (most frequently accessed)
    async warmCoreCompetences() {
        try {
            this.fastify.log.info('Warming core competences cache...');
            const query = `
        SELECT code, niveau, matiere, description, prerequis_codes
        FROM competences
        WHERE niveau IN ('CP', 'CE1', 'CE2')
        AND matiere IN ('FRANCAIS', 'MATHEMATIQUES')
        ORDER BY niveau, matiere
      `;
            const [competences] = await this.fastify.db.execute(query);
            const warmingPromises = competences.map(async (comp) => {
                const cacheKey = `competence:${comp.code}`;
                await this.advancedCache.set(cacheKey, comp, {
                    ttl: 7200, // 2 hours
                    tags: ['competences', comp.niveau, comp.matiere],
                    prefix: 'edu'
                });
            });
            await Promise.all(warmingPromises);
            this.fastify.log.info(`Warmed ${competences.length} core competences`);
        }
        catch (error) {
            this.fastify.log.error('Error warming core competences:', error);
        }
    }
    // CRITICAL: Warm most popular exercises for instant loading
    async warmPopularExercises() {
        try {
            this.fastify.log.info('Warming popular exercises cache...');
            // Get most accessed exercises from the last 7 days
            const query = `
        SELECT e.id, e.titre, e.competence_id, e.niveau, e.matiere, e.contenu,
               COUNT(ea.id) as access_count
        FROM exercises e
        LEFT JOIN exercise_attempts ea ON e.id = ea.exercise_id
        WHERE ea.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY e.id
        ORDER BY access_count DESC, e.created_at DESC
        LIMIT 100
      `;
            const [exercises] = await this.fastify.db.execute(query);
            const warmingPromises = exercises.map(async (exercise) => {
                const cacheKey = `exercise:${exercise.id}`;
                await this.advancedCache.set(cacheKey, exercise, {
                    ttl: 3600, // 1 hour
                    tags: ['exercises', exercise.niveau, exercise.matiere],
                    prefix: 'edu'
                });
                // Also cache by competence for quick filtering
                const competenceCacheKey = `exercises:competence:${exercise.competence_id}`;
                const existingCompetenceExercises = await this.advancedCache.get(competenceCacheKey) || [];
                if (!existingCompetenceExercises.some((ex) => ex.id === exercise.id)) {
                    existingCompetenceExercises.push(exercise);
                    await this.advancedCache.set(competenceCacheKey, existingCompetenceExercises, {
                        ttl: 3600,
                        tags: ['exercises', exercise.competence_id],
                        prefix: 'edu'
                    });
                }
            });
            await Promise.all(warmingPromises);
            this.fastify.log.info(`Warmed ${exercises.length} popular exercises`);
        }
        catch (error) {
            this.fastify.log.error('Error warming popular exercises:', error);
        }
    }
    // IMPORTANT: Warm student progression data for active users
    async warmStudentProgressions() {
        try {
            this.fastify.log.info('Warming student progressions cache...');
            // Get active students (accessed in last 24 hours)
            const activeStudentsQuery = `
        SELECT id, niveau_actuel, xp, total_points
        FROM students
        WHERE dernier_acces >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        LIMIT 50
      `;
            const [activeStudents] = await this.fastify.db.execute(activeStudentsQuery);
            const warmingPromises = activeStudents.map(async (student) => {
                // Cache student basic info
                const studentKey = `student:${student.id}`;
                await this.advancedCache.set(studentKey, student, {
                    ttl: 1800, // 30 minutes
                    tags: ['students', student.niveau_actuel],
                    prefix: 'edu'
                });
                // Cache student progress for their current level
                const progressQuery = `
          SELECT competence_id, score, completed_at, attempts
          FROM student_progress
          WHERE student_id = ?
          ORDER BY completed_at DESC
          LIMIT 20
        `;
                const [progress] = await this.fastify.db.execute(progressQuery, [student.id]);
                const progressKey = `student:${student.id}:progress`;
                await this.advancedCache.set(progressKey, progress, {
                    ttl: 900, // 15 minutes
                    tags: ['progress', `student:${student.id}`],
                    prefix: 'edu'
                });
            });
            await Promise.all(warmingPromises);
            this.fastify.log.info(`Warmed progressions for ${activeStudents.length} active students`);
        }
        catch (error) {
            this.fastify.log.error('Error warming student progressions:', error);
        }
    }
    // CRITICAL: Warm curriculum level structure
    async warmCurriculumLevels() {
        try {
            this.fastify.log.info('Warming curriculum levels cache...');
            const levelsQuery = `
        SELECT niveau, COUNT(DISTINCT competence_id) as competence_count,
               COUNT(DISTINCT id) as exercise_count
        FROM exercises
        GROUP BY niveau
        ORDER BY
          CASE niveau
            WHEN 'cp' THEN 1
            WHEN 'ce1' THEN 2
            WHEN 'ce2' THEN 3
            WHEN 'cm1' THEN 4
            WHEN 'cm2' THEN 5
          END
      `;
            const [levels] = await this.fastify.db.execute(levelsQuery);
            // Cache overall curriculum structure
            await this.advancedCache.set('curriculum:levels', levels, {
                ttl: 7200, // 2 hours
                tags: ['curriculum', 'levels'],
                prefix: 'edu'
            });
            // Cache detailed info for each level
            const levelPromises = levels.map(async (level) => {
                const competencesQuery = `
          SELECT DISTINCT competence_id, COUNT(*) as exercise_count
          FROM exercises
          WHERE niveau = ?
          GROUP BY competence_id
          ORDER BY competence_id
        `;
                const [competences] = await this.fastify.db.execute(competencesQuery, [level.niveau]);
                const levelKey = `curriculum:level:${level.niveau}`;
                await this.advancedCache.set(levelKey, {
                    ...level,
                    competences
                }, {
                    ttl: 7200,
                    tags: ['curriculum', level.niveau],
                    prefix: 'edu'
                });
            });
            await Promise.all(levelPromises);
            this.fastify.log.info(`Warmed curriculum structure for ${levels.length} levels`);
        }
        catch (error) {
            this.fastify.log.error('Error warming curriculum levels:', error);
        }
    }
    // IMPORTANT: Warm exercise statistics for analytics
    async warmExerciseStats() {
        try {
            this.fastify.log.info('Warming exercise statistics cache...');
            const statsQuery = `
        SELECT
          niveau,
          matiere,
          COUNT(*) as total_exercises,
          AVG(difficulty_level) as avg_difficulty,
          COUNT(DISTINCT competence_id) as unique_competences
        FROM exercises
        GROUP BY niveau, matiere
        ORDER BY niveau, matiere
      `;
            const [stats] = await this.fastify.db.execute(statsQuery);
            const globalStatsKey = 'stats:exercises:global';
            await this.advancedCache.set(globalStatsKey, stats, {
                ttl: 3600, // 1 hour
                tags: ['stats', 'exercises'],
                prefix: 'edu'
            });
            // Cache individual level/subject combinations
            const individualPromises = stats.map(async (stat) => {
                const statKey = `stats:exercises:${stat.niveau}:${stat.matiere}`;
                await this.advancedCache.set(statKey, stat, {
                    ttl: 3600,
                    tags: ['stats', stat.niveau, stat.matiere],
                    prefix: 'edu'
                });
            });
            await Promise.all(individualPromises);
            this.fastify.log.info(`Warmed statistics for ${stats.length} level/subject combinations`);
        }
        catch (error) {
            this.fastify.log.error('Error warming exercise statistics:', error);
        }
    }
    // CRITICAL: Warm authentication-related data
    async warmAuthenticationData() {
        try {
            this.fastify.log.info('Warming authentication data cache...');
            // Cache frequently accessed student authentication info
            const authQuery = `
        SELECT id, email, password_hash, failed_login_attempts, locked_until
        FROM students
        WHERE dernier_acces >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY dernier_acces DESC
        LIMIT 100
      `;
            const [authData] = await this.fastify.db.execute(authQuery);
            const authPromises = authData.map(async (student) => {
                const authKey = `auth:student:${student.email}`;
                await this.advancedCache.set(authKey, {
                    id: student.id,
                    email: student.email,
                    passwordHash: student.password_hash,
                    failedAttempts: student.failed_login_attempts,
                    lockedUntil: student.locked_until
                }, {
                    ttl: 1800, // 30 minutes
                    tags: ['auth', `student:${student.id}`],
                    prefix: 'edu'
                });
            });
            await Promise.all(authPromises);
            this.fastify.log.info(`Warmed authentication data for ${authData.length} students`);
        }
        catch (error) {
            this.fastify.log.error('Error warming authentication data:', error);
        }
    }
    // PUBLIC METHODS
    async startWarmingScheduler() {
        this.fastify.log.info('Starting cache warming scheduler...');
        // Execute critical strategies immediately
        const criticalStrategies = this.strategies.filter(s => s.priority === 'critical' && s.enabled);
        await this.executeCriticalWarming(criticalStrategies);
        // Schedule all strategies
        this.strategies.forEach(strategy => {
            if (strategy.enabled) {
                setInterval(async () => {
                    if (!this.isWarming) {
                        this.isWarming = true;
                        try {
                            await strategy.execute();
                        }
                        catch (error) {
                            this.fastify.log.error(`Warming strategy '${strategy.name}' failed:`, error);
                        }
                        finally {
                            this.isWarming = false;
                        }
                    }
                }, strategy.interval);
                this.fastify.log.info(`Scheduled warming strategy '${strategy.name}' every ${strategy.interval / 1000}s`);
            }
        });
    }
    async executeCriticalWarming(strategies) {
        const strategiesToExecute = strategies || this.strategies.filter(s => s.priority === 'critical' && s.enabled);
        this.fastify.log.info('Executing critical cache warming...', {
            strategies: strategiesToExecute.map(s => s.name)
        });
        const startTime = Date.now();
        const results = await Promise.allSettled(strategiesToExecute.map(strategy => strategy.execute()));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;
        this.fastify.log.info('Critical cache warming completed:', {
            total: results.length,
            successful,
            failed,
            duration: Date.now() - startTime
        });
    }
    getWarmingStatus() {
        return {
            strategies: this.strategies.map(s => ({
                name: s.name,
                priority: s.priority,
                enabled: s.enabled,
                interval: s.interval
            }))
        };
    }
    async enableStrategy(name) {
        const strategy = this.strategies.find(s => s.name === name);
        if (strategy) {
            strategy.enabled = true;
            this.fastify.log.info(`Enabled warming strategy: ${name}`);
            return true;
        }
        return false;
    }
    async disableStrategy(name) {
        const strategy = this.strategies.find(s => s.name === name);
        if (strategy) {
            strategy.enabled = false;
            this.fastify.log.info(`Disabled warming strategy: ${name}`);
            return true;
        }
        return false;
    }
}
exports.CacheWarmingService = CacheWarmingService;
