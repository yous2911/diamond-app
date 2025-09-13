/**
 * Secure Authentication Service with bcrypt
 * Implements password hashing, validation, and account security
 */

import * as bcrypt from 'bcrypt';
import { db } from '../db/connection';
import { students } from '../db/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import * as crypto from 'crypto';
import { logger } from '../utils/logger';
import { AuthenticationError, ConflictError, NotFoundError } from '../utils/AppError';

interface LoginCredentials {
  email?: string;
  prenom?: string;
  nom?: string;
  password: string;
}

// This will now return the student object on success, not tokens
interface AuthResult {
  student?: any;
  lockoutInfo?: {
    isLocked: boolean;
    remainingTime?: number;
    attemptsRemaining?: number;
  };
}

interface RegisterData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  dateNaissance: string;
  niveauActuel: string;
}

// Converted to an injectable class (no more 'static')
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Hash password using bcrypt with secure salt rounds
   */
  async hashPassword(password: string): Promise<string> {
    // Password policy will be enforced by Zod schema at the route level
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    return await bcrypt.compare(password, hash);
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(studentId: number): Promise<boolean> {
    const student = await db.select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) return false;

    const lockedUntil = student[0].lockedUntil;
    if (!lockedUntil) return false;

    return new Date() < new Date(lockedUntil);
  }

  /**
   * Lock account after failed attempts
   */
  async lockAccount(studentId: number): Promise<void> {
    const lockUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    
    await db.update(students)
      .set({
        lockedUntil: lockUntil,
        failedLoginAttempts: this.MAX_LOGIN_ATTEMPTS
      })
      .where(eq(students.id, studentId));
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(studentId: number): Promise<number> {
    const student = await db.select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) return 0;

    const newAttempts = (student[0].failedLoginAttempts || 0) + 1;

    await db.update(students)
      .set({ failedLoginAttempts: newAttempts })
      .where(eq(students.id, studentId));

    // Lock account if max attempts reached
    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockAccount(studentId);
    }

    return newAttempts;
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedAttempts(studentId: number): Promise<void> {
    await db.update(students)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null
      })
      .where(eq(students.id, studentId));
  }

  /**
   * Register new student with secure password
   */
  async registerStudent(data: RegisterData): Promise<any> {
    // Check if email already exists
    const existingStudent = await db.select()
      .from(students)
      .where(eq(students.email, data.email))
      .limit(1);

    if (existingStudent.length > 0) {
      throw new ConflictError('Un compte avec cette adresse email existe déjà');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create student
    const newStudentResult = await db.insert(students).values({
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
    }).returning({ id: students.id });

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
  async authenticateStudent(credentials: LoginCredentials): Promise<any> {
    let student;

    // Find student by email or name combination
    if (credentials.email) {
      const result = await db.select().from(students).where(eq(students.email, credentials.email)).limit(1);
      student = result[0];
    } else if (credentials.prenom && credentials.nom) {
      const result = await db.select().from(students).where(and(eq(students.prenom, credentials.prenom), eq(students.nom, credentials.nom))).limit(1);
      student = result[0];
    }

    if (!student) {
      throw new AuthenticationError('Identifiants incorrects');
    }

    // Check if account is locked
    const isLocked = await this.isAccountLocked(student.id);
    if (isLocked) {
      throw new AuthenticationError('Compte temporairement verrouillé. Veuillez réessayer plus tard.');
    }

    // Verify password
    if (!student.passwordHash) {
      throw new AuthenticationError('Veuillez configurer un mot de passe pour ce compte');
    }

    const isPasswordValid = await this.verifyPassword(credentials.password, student.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await this.incrementFailedAttempts(student.id);
      throw new AuthenticationError('Mot de passe incorrect');
    }

    // Successful login - reset failed attempts
    await this.resetFailedAttempts(student.id);

    // Update last access
    await db.update(students)
      .set({
        dernierAcces: new Date(),
        estConnecte: true
      })
      .where(eq(students.id, student.id));

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
  async logoutStudent(studentId: number): Promise<void> {
    await db.update(students)
      .set({ estConnecte: false })
      .where(eq(students.id, studentId));
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const student = await db.select()
      .from(students)
      .where(eq(students.email, email))
      .limit(1);

    if (student.length === 0) {
      return null;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(students)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      })
      .where(eq(students.id, student[0].id));

    return resetToken;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const student = await db.select()
      .from(students)
      .where(
        and(
          eq(students.passwordResetToken, token),
          gt(students.passwordResetExpires, new Date())
        )
      )
      .limit(1);

    if (student.length === 0) {
      return false;
    }

    const passwordHash = await this.hashPassword(newPassword);

    await db.update(students)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      })
      .where(eq(students.id, student[0].id));

    return true;
  }
}