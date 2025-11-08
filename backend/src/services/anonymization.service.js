"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anonymizationService = void 0;
// src/services/anonymization.service.ts
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const encryption_service_1 = require("./encryption.service");
const audit_trail_service_1 = require("./audit-trail.service");
const auditTrailService = new audit_trail_service_1.AuditTrailService();
class AnonymizationService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
        this.anonymizationRules = [
            { field: 'prenom', strategy: 'REPLACE', replacement: 'Anonyme' },
            { field: 'nom', strategy: 'REPLACE', replacement: 'Utilisateur' },
            { field: 'dateNaissance', strategy: 'GENERALIZE' },
            { field: 'niveauActuel', strategy: 'REPLACE', replacement: 'Niveau' },
            { field: 'mascotteType', strategy: 'REPLACE', replacement: 'default' },
        ];
    }
    async anonymizeStudentData(studentId) {
        try {
            let affectedRecords = 0;
            // 1. Anonymiser les données de l'étudiant
            const anonymousId = encryption_service_1.encryptionService.generateAnonymousId();
            await this.db
                .update(schema_1.students)
                .set({
                prenom: 'Anonyme',
                nom: `Utilisateur-${anonymousId.slice(0, 8)}`,
                dateNaissance: new Date('2000-01-01'),
                niveauActuel: 'Niveau',
                mascotteType: 'default',
                dernierAcces: null,
                estConnecte: false,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
            affectedRecords += 1;
            // 2. Anonymiser les métadonnées des sessions
            const sessionResult = await this.db
                .update(schema_1.sessions)
                .set({
                studentId: null
            })
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.studentId, studentId));
            affectedRecords += 1;
            // 3. Anonymiser les fichiers associés
            await this.db
                .update(schema_1.gdprFiles)
                .set({
                fileName: 'fichier_anonymise.dat'
            })
                .where((0, drizzle_orm_1.eq)(schema_1.gdprFiles.studentId, studentId));
            affectedRecords += 1;
            // 4. Conserver les données d'apprentissage (sans identification)
            // Les données de progress et revisions sont conservées pour les statistiques
            // mais ne contiennent pas d'informations personnelles identifiables
            await auditTrailService.logAction({
                entityType: 'student',
                entityId: studentId.toString(),
                action: 'anonymize',
                userId: 'system',
                details: { reason: 'Student data anonymized' },
                severity: 'high',
            });
            return { success: true, affectedRecords };
        }
        catch (error) {
            console.error('Erreur lors de l\'anonymisation:', error);
            throw new Error('Échec de l\'anonymisation des données');
        }
    }
    async applyAnonymizationRules(data) {
        const anonymizedData = { ...data };
        for (const rule of this.anonymizationRules) {
            if (anonymizedData[rule.field] !== undefined) {
                switch (rule.strategy) {
                    case 'REMOVE':
                        delete anonymizedData[rule.field];
                        break;
                    case 'HASH':
                        if (anonymizedData[rule.field]) {
                            anonymizedData[rule.field] = encryption_service_1.encryptionService.hashPersonalData(anonymizedData[rule.field].toString());
                        }
                        break;
                    case 'REPLACE':
                        anonymizedData[rule.field] = rule.replacement || 'ANONYMIZED';
                        break;
                    case 'GENERALIZE':
                        // Stratégie de généralisation (ex: âge exact -> tranche d'âge)
                        if (rule.field === 'age' && typeof anonymizedData[rule.field] === 'number') {
                            const age = anonymizedData[rule.field];
                            anonymizedData[rule.field] = Math.floor(age / 5) * 5 + '-' + (Math.floor(age / 5) * 5 + 4);
                        }
                        break;
                }
            }
        }
        return anonymizedData;
    }
    async verifyAnonymization(studentId) {
        const issues = [];
        // Vérifier l'étudiant
        const student = await this.db
            .select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId))
            .limit(1);
        if (student.length > 0) {
            const studentData = student[0];
            if (studentData.prenom !== 'Anonyme') {
                issues.push('Prénom non anonymisé');
            }
            if (studentData.nom && !studentData.nom.startsWith('Utilisateur-')) {
                issues.push('Nom non anonymisé');
            }
            if (studentData.niveauActuel !== 'Niveau') {
                issues.push('Niveau actuel non anonymisé');
            }
        }
        return {
            isAnonymized: issues.length === 0,
            issues,
        };
    }
}
exports.anonymizationService = new AnonymizationService();
