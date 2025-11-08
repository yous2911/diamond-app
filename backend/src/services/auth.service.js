"use strict";
/**
 * Secure Authentication Service with bcrypt
 * Implements password hashing, validation, and account security
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
exports.AuthService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto = __importStar(require("crypto"));
const AppError_1 = require("../utils/AppError");
// Converted to an injectable class (no more 'static')
class AuthService {
    constructor() {
        this.SALT_ROUNDS = 12;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    }
    /**
     * Hash password using bcrypt with secure salt rounds
     */
    async hashPassword(password) {
        // Password policy will be enforced by Zod schema at the route level
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        if (!password || !hash) {
            return false;
        }
        return await bcrypt.compare(password, hash);
    }
    /**
     * Check if account is locked
     */
    async isAccountLocked(studentId) {
        const student = await connection_1.db.select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId))
            .limit(1);
        if (student.length === 0)
            return false;
        const lockedUntil = student[0].lockedUntil;
        if (!lockedUntil)
            return false;
        return new Date() < new Date(lockedUntil);
    }
    /**
     * Lock account after failed attempts
     */
    async lockAccount(studentId) {
        const lockUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
        await connection_1.db.update(schema_1.students)
            .set({
            lockedUntil: lockUntil,
            failedLoginAttempts: this.MAX_LOGIN_ATTEMPTS
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
    }
    /**
     * Increment failed login attempts
     */
    async incrementFailedAttempts(studentId) {
        const student = await connection_1.db.select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId))
            .limit(1);
        if (student.length === 0)
            return 0;
        const newAttempts = (student[0].failedLoginAttempts || 0) + 1;
        await connection_1.db.update(schema_1.students)
            .set({ failedLoginAttempts: newAttempts })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
        // Lock account if max attempts reached
        if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            await this.lockAccount(studentId);
        }
        return newAttempts;
    }
    /**
     * Reset failed login attempts on successful login
     */
    async resetFailedAttempts(studentId) {
        await connection_1.db.update(schema_1.students)
            .set({
            failedLoginAttempts: 0,
            lockedUntil: null
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
    }
    /**
     * Register new student with secure password
     */
    async registerStudent(data, log) {
        log.info({ email: data.email }, 'Registering new student');
        // Check if email already exists
        const existingStudent = await connection_1.db.select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.email, data.email))
            .limit(1);
        if (existingStudent.length > 0) {
            throw new AppError_1.ConflictError('Un compte avec cette adresse email existe déjà');
        }
        // Hash password
        const passwordHash = await this.hashPassword(data.password);
        // Create student
        const newStudentResult = await connection_1.db.insert(schema_1.students).values({
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            passwordHash,
            dateNaissance: new Date(data.dateNaissance),
            niveauActuel: data.niveauActuel,
            niveauScolaire: data.niveauActuel,
            totalPoints: 0,
            serieJours: 0,
            mascotteType: 'dragon'
        }).returning({ id: schema_1.students.id });
        const studentId = newStudentResult[0].id;
        // The service now returns the student data, not tokens.
        return {
            id: studentId,
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            role: 'student', // New users default to 'student' role
            niveauActuel: data.niveauActuel
        };
    }
    /**
     * Authenticate student with secure password verification
     */
    async authenticateStudent(credentials, log) {
        log.info({ email: credentials.email, prenom: credentials.prenom, nom: credentials.nom }, 'Authenticating student');
        let student;
        // Find student by email or name combination
        if (credentials.email) {
            const result = await connection_1.db.select().from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.email, credentials.email)).limit(1);
            student = result[0];
        }
        else if (credentials.prenom && credentials.nom) {
            const result = await connection_1.db.select().from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.prenom, credentials.prenom), (0, drizzle_orm_1.eq)(schema_1.students.nom, credentials.nom))).limit(1);
            student = result[0];
        }
        if (!student) {
            throw new AppError_1.AuthenticationError('Identifiants incorrects');
        }
        // Check if account is locked
        const isLocked = await this.isAccountLocked(student.id);
        if (isLocked) {
            throw new AppError_1.AuthenticationError('Compte temporairement verrouillé. Veuillez réessayer plus tard.');
        }
        // Verify password
        if (!student.passwordHash) {
            throw new AppError_1.AuthenticationError('Veuillez configurer un mot de passe pour ce compte');
        }
        const isPasswordValid = await this.verifyPassword(credentials.password, student.passwordHash);
        if (!isPasswordValid) {
            // Increment failed attempts
            await this.incrementFailedAttempts(student.id);
            throw new AppError_1.AuthenticationError('Mot de passe incorrect');
        }
        // Successful login - reset failed attempts
        await this.resetFailedAttempts(student.id);
        // Update last access
        await connection_1.db.update(schema_1.students)
            .set({
            dernierAcces: new Date(),
            estConnecte: true
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, student.id));
        // The service now returns the full student object.
        return {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            email: student.email,
            role: student.role,
            niveauActuel: student.niveauActuel,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
            mascotteType: student.mascotteType
        };
    }
    /**
     * Logout student
     */
    async logoutStudent(studentId) {
        await connection_1.db.update(schema_1.students)
            .set({ estConnecte: false })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
    }
    /**
     * Generate password reset token
     */
    async generatePasswordResetToken(email) {
        const student = await connection_1.db.select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.email, email))
            .limit(1);
        if (student.length === 0) {
            return null;
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await connection_1.db.update(schema_1.students)
            .set({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, student[0].id));
        return resetToken;
    }
    /**
     * Reset password using token
     */
    async resetPassword(token, newPassword) {
        const student = await connection_1.db.select()
            .from(schema_1.students)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.passwordResetToken, token), (0, drizzle_orm_1.gt)(schema_1.students.passwordResetExpires, new Date())))
            .limit(1);
        if (student.length === 0) {
            return false;
        }
        const passwordHash = await this.hashPassword(newPassword);
        await connection_1.db.update(schema_1.students)
            .set({
            passwordHash,
            passwordResetToken: null,
            passwordResetExpires: null,
            failedLoginAttempts: 0,
            lockedUntil: null
        })
            .where((0, drizzle_orm_1.eq)(schema_1.students.id, student[0].id));
        return true;
    }
}
exports.AuthService = AuthService;
