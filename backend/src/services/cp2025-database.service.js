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
exports.CP2025DatabaseService = void 0;
const connection_1 = require("../db/connection");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
class CP2025DatabaseService {
    async getAllExercises() {
        try {
            const exercises = await connection_1.db.select().from(schema.exercises);
            return exercises || [];
        }
        catch (error) {
            console.error('Error fetching exercises:', error);
            return [];
        }
    }
    async getExerciseById(id) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.id, id))
                .limit(1);
            return exercises[0];
        }
        catch (error) {
            console.error('Error fetching exercise by ID:', error);
            return undefined;
        }
    }
    async getExercisesByModule(moduleId) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.type, moduleId.toString()));
            return exercises || [];
        }
        catch (error) {
            console.error('Error fetching exercises by module:', error);
            return [];
        }
    }
    async createExercise(exerciseData) {
        try {
            await connection_1.db
                .insert(schema.exercises)
                .values({
                type: exerciseData.type,
                titre: exerciseData.titre,
                matiere: exerciseData.matiere,
                niveau: exerciseData.niveau,
                difficulte: exerciseData.difficulte || 'moyen',
                competenceCode: exerciseData.competenceCode || 'general',
                description: exerciseData.description,
                prerequis: exerciseData.prerequis,
                contenu: exerciseData.contenu || {},
                solution: exerciseData.solution || {},
                typeExercice: exerciseData.typeExercice || 'qcm',
                metadonnees: exerciseData.metadonnees
            });
            // Get the created exercise by searching for it
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.titre, exerciseData.titre))
                .limit(1);
            return exercises[0] || null;
        }
        catch (error) {
            console.error('Error creating exercise:', error);
            return null;
        }
    }
    async getAllModules() {
        try {
            const modules = await connection_1.db.select().from(schema.modules);
            return modules || [];
        }
        catch (error) {
            console.error('Error fetching modules:', error);
            return [];
        }
    }
    async getModuleById(id) {
        try {
            const modules = await connection_1.db
                .select()
                .from(schema.modules)
                .where((0, drizzle_orm_1.eq)(schema.modules.id, id))
                .limit(1);
            return modules[0];
        }
        catch (error) {
            console.error('Error fetching module by ID:', error);
            return undefined;
        }
    }
    async getStudentById(id) {
        try {
            const students = await connection_1.db
                .select()
                .from(schema.students)
                .where((0, drizzle_orm_1.eq)(schema.students.id, id))
                .limit(1);
            return students[0];
        }
        catch (error) {
            console.error('Error fetching student by ID:', error);
            return undefined;
        }
    }
    async getExercisesByLevel(niveau) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.difficulte, niveau));
            return exercises || [];
        }
        catch (error) {
            console.error('Error fetching exercises by level:', error);
            return [];
        }
    }
    async getExercisesByDifficulty(difficulte) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.difficulte, difficulte));
            return exercises || [];
        }
        catch (error) {
            console.error('Error fetching exercises by difficulty:', error);
            return [];
        }
    }
    async getExercisesBySubject(matiere) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.type, matiere));
            return exercises || [];
        }
        catch (error) {
            console.error('Error fetching exercises by subject:', error);
            return [];
        }
    }
    async searchExercises(searchTerm) {
        try {
            const exercises = await connection_1.db
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.like)(schema.exercises.titre, `%${searchTerm}%`));
            return exercises || [];
        }
        catch (error) {
            console.error('Error searching exercises:', error);
            return [];
        }
    }
    async getExerciseStatistics() {
        try {
            const stats = await connection_1.db
                .select({
                totalExercises: (0, drizzle_orm_1.sql) `count(*)`,
                facileCount: (0, drizzle_orm_1.sql) `count(case when difficulte = 'FACILE' then 1 end)`,
                moyenCount: (0, drizzle_orm_1.sql) `count(case when difficulte = 'MOYEN' then 1 end)`,
                difficileCount: (0, drizzle_orm_1.sql) `count(case when difficulte = 'DIFFICILE' then 1 end)`,
            })
                .from(schema.exercises);
            return stats[0] || {};
        }
        catch (error) {
            console.error('Error fetching exercise statistics:', error);
            return {};
        }
    }
}
exports.CP2025DatabaseService = CP2025DatabaseService;
