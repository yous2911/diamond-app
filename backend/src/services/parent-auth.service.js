"use strict";
/**
 * PARENT AUTHENTICATION SERVICE
 * Handles parent login, registration, and session management
 * Works alongside existing student authentication system
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentAuthService = exports.ParentAuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_js_1 = require("../db/connection.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const config_js_1 = require("../config/config.js");
class ParentAuthService {
    /**
     * Register a new parent
     */
    async register(data) {
        // Check if parent already exists
        const existingParent = await connection_js_1.db
            .select()
            .from(schema_js_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_js_1.parents.email, data.email))
            .limit(1);
        if (existingParent.length > 0) {
            throw new Error('Un compte parent avec cet email existe déjà');
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        // Create parent
        const [newParent] = await connection_js_1.db
            .insert(schema_js_1.parents)
            .values({
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            passwordHash,
            telephone: data.telephone,
            emailVerified: false, // Will need email verification
            dailyReportEnabled: true,
            weeklyReportEnabled: true,
            achievementNotificationsEnabled: true,
            progressAlertsEnabled: true
        })
            .returning();
        // Link to existing children if provided
        const children = [];
        if (data.childrenIds && data.childrenIds.length > 0) {
            for (const childId of data.childrenIds) {
                // Verify child exists
                const [child] = await connection_js_1.db
                    .select()
                    .from(schema_js_1.students)
                    .where((0, drizzle_orm_1.eq)(schema_js_1.students.id, childId))
                    .limit(1);
                if (child) {
                    // Create parent-child relationship
                    await connection_js_1.db
                        .insert(schema_js_1.parentStudentRelations)
                        .values({
                        parentId: newParent.id,
                        studentId: childId,
                        relationshipType: 'parent',
                        isPrimaryContact: true,
                        canViewProgress: true,
                        canManageAccount: true,
                        canReceiveReports: true
                    });
                    children.push({
                        id: child.id,
                        nom: child.nom,
                        prenom: child.prenom,
                        niveau: child.niveauActuel
                    });
                }
            }
        }
        // Generate JWT token
        const token = this.generateToken({
            id: newParent.id,
            email: newParent.email,
            nom: newParent.nom,
            prenom: newParent.prenom,
            type: 'parent',
            children
        });
        return { parent: newParent, token, children };
    }
    /**
     * Login parent
     */
    async login(data) {
        // Find parent by email
        const [parent] = await connection_js_1.db
            .select()
            .from(schema_js_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_js_1.parents.email, data.email))
            .limit(1);
        if (!parent) {
            throw new Error('Email ou mot de passe incorrect');
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(data.password, parent.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Email ou mot de passe incorrect');
        }
        // Check if account is locked
        if (parent.lockedUntil && parent.lockedUntil > new Date()) {
            throw new Error('Compte temporairement verrouillé. Réessayez plus tard.');
        }
        // Get linked children
        const children = await connection_js_1.db
            .select({
            id: schema_js_1.students.id,
            nom: schema_js_1.students.nom,
            prenom: schema_js_1.students.prenom,
            niveau: schema_js_1.students.niveauActuel
        })
            .from(schema_js_1.students)
            .innerJoin(schema_js_1.parentStudentRelations, (0, drizzle_orm_1.eq)(schema_js_1.students.id, schema_js_1.parentStudentRelations.studentId))
            .where((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.parentId, parent.id));
        // Update last login
        await connection_js_1.db
            .update(schema_js_1.parents)
            .set({
            lastLogin: new Date(),
            failedLoginAttempts: 0
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.parents.id, parent.id));
        // Generate JWT token
        const token = this.generateToken({
            id: parent.id,
            email: parent.email,
            nom: parent.nom,
            prenom: parent.prenom,
            type: 'parent',
            children
        });
        return { parent, token, children };
    }
    /**
     * Link child to parent
     */
    async linkChild(parentId, childId, relationshipType = 'parent') {
        // Check if relationship already exists
        const existingRelation = await connection_js_1.db
            .select()
            .from(schema_js_1.parentStudentRelations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.parentId, parentId), (0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.studentId, childId)))
            .limit(1);
        if (existingRelation.length > 0) {
            throw new Error('Cette relation parent-enfant existe déjà');
        }
        // Verify child exists
        const [child] = await connection_js_1.db
            .select()
            .from(schema_js_1.students)
            .where((0, drizzle_orm_1.eq)(schema_js_1.students.id, childId))
            .limit(1);
        if (!child) {
            throw new Error('Enfant non trouvé');
        }
        // Create relationship
        await connection_js_1.db
            .insert(schema_js_1.parentStudentRelations)
            .values({
            parentId,
            studentId: childId,
            relationshipType,
            isPrimaryContact: true,
            canViewProgress: true,
            canManageAccount: true,
            canReceiveReports: true
        });
    }
    /**
     * Verify parent JWT token
     */
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_js_1.config.JWT_SECRET);
            if (decoded.type !== 'parent') {
                throw new Error('Invalid token type');
            }
            // Verify parent still exists and is active
            const [parent] = await connection_js_1.db
                .select()
                .from(schema_js_1.parents)
                .where((0, drizzle_orm_1.eq)(schema_js_1.parents.id, decoded.id))
                .limit(1);
            if (!parent) {
                throw new Error('Parent not found');
            }
            // Get current children (in case relationships changed)
            const children = await connection_js_1.db
                .select({
                id: schema_js_1.students.id,
                nom: schema_js_1.students.nom,
                prenom: schema_js_1.students.prenom,
                niveau: schema_js_1.students.niveauActuel
            })
                .from(schema_js_1.students)
                .innerJoin(schema_js_1.parentStudentRelations, (0, drizzle_orm_1.eq)(schema_js_1.students.id, schema_js_1.parentStudentRelations.studentId))
                .where((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.parentId, parent.id));
            return {
                id: parent.id,
                email: parent.email,
                nom: parent.nom,
                prenom: parent.prenom,
                type: 'parent',
                children
            };
        }
        catch (error) {
            throw new Error('Token invalide');
        }
    }
    /**
     * Generate JWT token for parent
     */
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_js_1.config.JWT_SECRET, {
            expiresIn: '7d', // Parents get longer sessions
            issuer: 'diamond-app',
            audience: 'parent-dashboard'
        });
    }
    /**
     * Get parent profile with children
     */
    async getProfile(parentId) {
        const [parent] = await connection_js_1.db
            .select()
            .from(schema_js_1.parents)
            .where((0, drizzle_orm_1.eq)(schema_js_1.parents.id, parentId))
            .limit(1);
        if (!parent) {
            throw new Error('Parent non trouvé');
        }
        const children = await connection_js_1.db
            .select({
            id: schema_js_1.students.id,
            nom: schema_js_1.students.nom,
            prenom: schema_js_1.students.prenom,
            niveau: schema_js_1.students.niveauActuel,
            totalXP: schema_js_1.students.xp,
            currentStreak: schema_js_1.students.serieJours,
            lastLogin: schema_js_1.students.dernierAcces
        })
            .from(schema_js_1.students)
            .innerJoin(schema_js_1.parentStudentRelations, (0, drizzle_orm_1.eq)(schema_js_1.students.id, schema_js_1.parentStudentRelations.studentId))
            .where((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.parentId, parentId));
        return { parent, children };
    }
}
exports.ParentAuthService = ParentAuthService;
exports.parentAuthService = new ParentAuthService();
