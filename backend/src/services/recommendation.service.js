"use strict";
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
exports.recommendationService = exports.RecommendationService = void 0;
const connection_1 = require("../db/connection");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
class RecommendationService {
    async getRecommendedExercises(studentId, limit = 5) {
        try {
            const student = await connection_1.db
                .select()
                .from(schema.students)
                .where((0, drizzle_orm_1.eq)(schema.students.id, studentId))
                .limit(1);
            if (!student[0]) {
                return [];
            }
            // Get exercises the student has already completed
            const completedExercises = await connection_1.db
                .select({ exerciseId: schema.studentProgress.exerciseId })
                .from(schema.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.studentProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema.studentProgress.completed, true)));
            const completedIds = completedExercises.map(p => p.exerciseId);
            // Get recommended exercises based on student's niveau
            const whereConditions = [
                (0, drizzle_orm_1.eq)(schema.exercises.difficulte, student[0].niveauActuel),
                // exercises are active by default - removed estActif check
            ];
            // Exclude completed exercises if any exist
            if (completedIds.length > 0) {
                whereConditions.push((0, drizzle_orm_1.not)((0, drizzle_orm_1.sql) `${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
            }
            const recommendedExercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.and)(...whereConditions))
                .orderBy((0, drizzle_orm_1.sql) `RAND()`)
                .limit(limit);
            return recommendedExercises;
        }
        catch (error) {
            console.error('Error getting recommended exercises:', error);
            return [];
        }
    }
    async getNextExercise(studentId, moduleId) {
        try {
            const student = await connection_1.db
                .select()
                .from(schema.students)
                .where((0, drizzle_orm_1.eq)(schema.students.id, studentId))
                .limit(1);
            if (!student[0]) {
                return null;
            }
            // Get exercises the student has already completed
            const completedExercises = await connection_1.db
                .select({ exerciseId: schema.studentProgress.exerciseId })
                .from(schema.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.studentProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema.studentProgress.completed, true)));
            const completedIds = completedExercises.map(p => p.exerciseId);
            // Build where conditions
            const whereConditions = [
                (0, drizzle_orm_1.eq)(schema.exercises.difficulte, student[0].niveauActuel),
                // exercises are active by default - removed estActif check
            ];
            // Add module filter if specified
            if (moduleId) {
                whereConditions.push((0, drizzle_orm_1.eq)(schema.exercises.ordre, moduleId));
            }
            // Exclude completed exercises if any exist
            if (completedIds.length > 0) {
                whereConditions.push((0, drizzle_orm_1.not)((0, drizzle_orm_1.sql) `${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
            }
            const nextExercise = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.and)(...whereConditions))
                .orderBy(schema.exercises.id)
                .limit(1);
            return nextExercise[0] || null;
        }
        catch (error) {
            console.error('Error getting next exercise:', error);
            return null;
        }
    }
    async recordExerciseAttempt(data) {
        try {
            // Check if progress record exists
            const existingProgress = await connection_1.db
                .select()
                .from(schema.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.studentProgress.studentId, data.studentId), (0, drizzle_orm_1.eq)(schema.studentProgress.exerciseId, data.exerciseId)))
                .limit(1);
            const pointsGagnes = data.completed ? Math.round(data.score) : 0;
            if (existingProgress[0]) {
                // Update existing progress
                await connection_1.db
                    .update(schema.studentProgress)
                    .set({
                    completed: data.completed,
                    totalAttempts: (0, drizzle_orm_1.sql) `total_attempts + 1`,
                    successfulAttempts: data.completed ? (0, drizzle_orm_1.sql) `successful_attempts + 1` : (0, drizzle_orm_1.sql) `successful_attempts`,
                    timeSpent: (0, drizzle_orm_1.sql) `time_spent + ${data.timeSpent || 0}`,
                    averageScore: (0, drizzle_orm_1.sql) `(average_score + ${Math.round(data.score)}) / 2`,
                    bestScore: (0, drizzle_orm_1.sql) `GREATEST(best_score, ${Math.round(data.score)})`,
                    completedAt: data.completed && !existingProgress[0].completedAt ? new Date() : existingProgress[0].completedAt,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.studentProgress.studentId, data.studentId), (0, drizzle_orm_1.eq)(schema.studentProgress.exerciseId, data.exerciseId)));
            }
            else {
                // Create new progress record
                const newProgress = {
                    studentId: data.studentId,
                    exerciseId: data.exerciseId,
                    competenceCode: 'default', // Add required field
                    completed: data.completed,
                    averageScore: Math.round(data.score).toString(),
                    bestScore: Math.round(data.score).toString(),
                    timeSpent: data.timeSpent || 0,
                    totalAttempts: 1,
                    successfulAttempts: data.completed ? 1 : 0,
                    completedAt: data.completed ? new Date() : null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                await connection_1.db.insert(schema.studentProgress).values(newProgress);
            }
            // Update student's total points if completed
            if (data.completed) {
                await connection_1.db
                    .update(schema.students)
                    .set({
                    totalPoints: (0, drizzle_orm_1.sql) `total_points + ${pointsGagnes}`,
                    updatedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema.students.id, data.studentId));
            }
            return true;
        }
        catch (error) {
            console.error('Error recording exercise attempt:', error);
            return false;
        }
    }
    async getExercisesByDifficulty(studentId, difficulte) {
        try {
            const student = await connection_1.db
                .select()
                .from(schema.students)
                .where((0, drizzle_orm_1.eq)(schema.students.id, studentId))
                .limit(1);
            if (!student[0]) {
                return [];
            }
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exercises.difficulte, student[0].niveauActuel), (0, drizzle_orm_1.eq)(schema.exercises.difficulte, difficulte)))
                .orderBy(schema.exercises.id);
            return exercises;
        }
        catch (error) {
            console.error('Error getting exercises by difficulty:', error);
            return [];
        }
    }
    async getExercisesBySubject(studentId, matiere) {
        try {
            const student = await connection_1.db
                .select()
                .from(schema.students)
                .where((0, drizzle_orm_1.eq)(schema.students.id, studentId))
                .limit(1);
            if (!student[0]) {
                return [];
            }
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exercises.difficulte, student[0].niveauActuel), (0, drizzle_orm_1.eq)(schema.exercises.matiere, matiere)))
                .orderBy(schema.exercises.id);
            return exercises;
        }
        catch (error) {
            console.error('Error getting exercises by subject:', error);
            return [];
        }
    }
    async getStudentWeaknesses(studentId) {
        try {
            // Get exercises where student failed or struggled
            const weakAreas = await connection_1.db
                .select({
                matiere: schema.exercises.matiere,
                difficulte: schema.exercises.difficulte,
                count: (0, drizzle_orm_1.sql) `count(*)`,
            })
                .from(schema.studentProgress)
                .innerJoin(schema.exercises, (0, drizzle_orm_1.eq)(schema.studentProgress.exerciseId, schema.exercises.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.studentProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema.studentProgress.completed, false)))
                .groupBy(schema.exercises.matiere, schema.exercises.difficulte)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `count(*)`));
            return weakAreas.map(area => ({
                matiere: area.matiere,
                difficulte: area.difficulte,
                count: Number(area.count),
            }));
        }
        catch (error) {
            console.error('Error getting student weaknesses:', error);
            return [];
        }
    }
    async getPersonalizedRecommendations(studentId, limit = 10) {
        try {
            const weaknesses = await this.getStudentWeaknesses(studentId);
            if (weaknesses.length === 0) {
                // If no weaknesses, recommend based on current level
                return await this.getRecommendedExercises(studentId, limit);
            }
            // Focus on weakest areas
            const recommendations = [];
            for (const weakness of weaknesses.slice(0, 3)) { // Top 3 weak areas
                const exercises = await connection_1.db
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exercises.matiere, weakness.matiere), (0, drizzle_orm_1.eq)(schema.exercises.difficulte, weakness.difficulte)))
                    .orderBy((0, drizzle_orm_1.sql) `RAND()`)
                    .limit(Math.ceil(limit / 3));
                recommendations.push(...exercises);
            }
            return recommendations.slice(0, limit);
        }
        catch (error) {
            console.error('Error getting personalized recommendations:', error);
            return [];
        }
    }
}
exports.RecommendationService = RecommendationService;
exports.recommendationService = new RecommendationService();
