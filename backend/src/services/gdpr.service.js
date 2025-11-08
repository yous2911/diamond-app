"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gdprService = void 0;
// src/services/gdpr.service.ts
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
class GdprService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
    }
    async logDataProcessing(data) {
        const logEntry = {
            studentId: data.studentId || null,
            action: data.action,
            dataType: data.dataType,
            details: data.description || '',
            createdAt: new Date(),
        };
        await this.db.insert(schema_1.gdprDataProcessingLog).values(logEntry);
    }
    async exportStudentData(studentId) {
        // Récupérer toutes les données de l'étudiant
        const studentData = await this.db
            .select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId))
            .limit(1);
        const progressData = await this.db
            .select()
            .from(schema_1.studentProgress)
            .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId));
        const sessionsData = await this.db
            .select()
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.studentId, studentId));
        const revisionsData = await this.db
            .select()
            .from(schema_1.revisions)
            .where((0, drizzle_orm_1.eq)(schema_1.revisions.studentId, studentId));
        const filesData = await this.db
            .select()
            .from(schema_1.gdprFiles)
            .where((0, drizzle_orm_1.eq)(schema_1.gdprFiles.studentId, studentId));
        return {
            student: studentData[0] || null,
            progress: progressData,
            sessions: sessionsData,
            revisions: revisionsData,
            files: filesData,
            exportedAt: new Date().toISOString(),
            dataTypes: ['student', 'progress', 'sessions', 'revisions', 'files'],
        };
    }
    async softDeleteStudentData(studentId) {
        let affectedRecords = 0;
        // Marquer comme supprimé sans effacer physiquement
        await this.db
            .update(schema_1.students)
            .set({
            estConnecte: false,
            dernierAcces: null,
            // Ajouter un flag de suppression logique si nécessaire
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
        affectedRecords += 1; // Assume one record was affected
        return { success: true, affectedRecords };
    }
    async hardDeleteStudentData(studentId) {
        let affectedRecords = 0;
        // Supprimer dans l'ordre inverse des dépendances
        await this.db.delete(schema_1.gdprFiles).where((0, drizzle_orm_1.eq)(schema_1.gdprFiles.studentId, studentId));
        affectedRecords += 1; // Assume one record was affected
        await this.db.delete(schema_1.revisions).where((0, drizzle_orm_1.eq)(schema_1.revisions.studentId, studentId));
        affectedRecords += 1; // Assume one record was affected
        await this.db.delete(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.studentId, studentId));
        affectedRecords += 1; // Assume one record was affected
        await this.db.delete(schema_1.studentProgress).where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId));
        affectedRecords += 1; // Assume one record was affected
        await this.db.delete(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
        affectedRecords += 1; // Assume one record was affected
        return { success: true, affectedRecords };
    }
    convertToCSV(data) {
        let csv = '';
        // En-têtes
        csv += 'Table,Field,Value\n';
        // Parcourir récursivement les données
        const flattenObject = (obj, tableName, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const fieldName = prefix ? `${prefix}.${key}` : key;
                if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (typeof item === 'object') {
                            flattenObject(item, tableName, `${fieldName}[${index}]`);
                        }
                        else {
                            csv += `${tableName},"${fieldName}[${index}]","${item}"\n`;
                        }
                    });
                }
                else if (typeof value === 'object' && value !== null) {
                    flattenObject(value, tableName, fieldName);
                }
                else {
                    csv += `${tableName},"${fieldName}","${value}"\n`;
                }
            }
        };
        if (data.student)
            flattenObject(data.student, 'student');
        if (data.progress)
            data.progress.forEach((p, i) => flattenObject(p, 'progress', `record_${i}`));
        if (data.sessions)
            data.sessions.forEach((s, i) => flattenObject(s, 'sessions', `record_${i}`));
        if (data.revisions)
            data.revisions.forEach((r, i) => flattenObject(r, 'revisions', `record_${i}`));
        if (data.files)
            data.files.forEach((f, i) => flattenObject(f, 'files', `record_${i}`));
        return csv;
    }
}
exports.gdprService = new GdprService();
