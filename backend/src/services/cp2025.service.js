"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CP2025Service = void 0;
const cp2025_database_service_1 = require("./cp2025-database.service");
class CP2025Service {
    constructor() {
        this.dbService = new cp2025_database_service_1.CP2025DatabaseService();
    }
    async getAllExercises() {
        return await this.dbService.getAllExercises();
    }
    async getExerciseById(id) {
        const exercise = await this.dbService.getExerciseById(id);
        return exercise || null;
    }
    async getExercisesByModule(moduleId) {
        return await this.dbService.getExercisesByModule(moduleId);
    }
    async getExercisesByLevel(niveau) {
        return await this.dbService.getExercisesByLevel(niveau);
    }
    async getExercisesByDifficulty(difficulte) {
        return await this.dbService.getExercisesByDifficulty(difficulte);
    }
    async getExercisesBySubject(matiere) {
        return await this.dbService.getExercisesBySubject(matiere);
    }
    async searchExercises(searchTerm) {
        return await this.dbService.searchExercises(searchTerm);
    }
    async getAllModules() {
        return await this.dbService.getAllModules();
    }
    async getModuleById(id) {
        const module = await this.dbService.getModuleById(id);
        return module || null;
    }
    async getStudentById(id) {
        const student = await this.dbService.getStudentById(id);
        return student || null;
    }
    async getExerciseStatistics() {
        return await this.dbService.getExerciseStatistics();
    }
    async getModuleStatistics() {
        try {
            const modules = await this.dbService.getAllModules();
            const stats = {
                totalModules: modules.length,
                byNiveau: {},
                byMatiere: {},
            };
            modules.forEach(module => {
                // Count by niveau
                stats.byNiveau[module.niveau] = (stats.byNiveau[module.niveau] || 0) + 1;
                // Count by matiere
                stats.byMatiere[module.matiere] = (stats.byMatiere[module.matiere] || 0) + 1;
            });
            return stats;
        }
        catch (error) {
            console.error('Error getting module statistics:', error);
            return {
                totalModules: 0,
                byNiveau: {},
                byMatiere: {},
            };
        }
    }
}
exports.CP2025Service = CP2025Service;
