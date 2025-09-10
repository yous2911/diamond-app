/**
 * PARENT AUTHENTICATION SERVICE
 * Handles parent login, registration, and session management
 * Works alongside existing student authentication system
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/setup.js';
import { parents, parentStudentRelations, students, type Parent, type NewParent } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { config } from '../config/config.js';

export interface ParentSession {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  type: 'parent';
  children: Array<{
    id: number;
    nom: string;
    prenom: string;
    niveau: string;
  }>;
}

export interface ParentLoginRequest {
  email: string;
  password: string;
}

export interface ParentRegistrationRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  childrenIds?: number[]; // IDs of existing children to link
}

export class ParentAuthService {
  
  /**
   * Register a new parent
   */
  async register(data: ParentRegistrationRequest): Promise<{ parent: Parent; token: string; children: any[] }> {
    // Check if parent already exists
    const existingParent = await db
      .select()
      .from(parents)
      .where(eq(parents.email, data.email))
      .limit(1);

    if (existingParent.length > 0) {
      throw new Error('Un compte parent avec cet email existe déjà');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create parent
    const [newParent] = await db
      .insert(parents)
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
        const [child] = await db
          .select()
          .from(students)
          .where(eq(students.id, childId))
          .limit(1);

        if (child) {
          // Create parent-child relationship
          await db
            .insert(parentStudentRelations)
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
  async login(data: ParentLoginRequest): Promise<{ parent: Parent; token: string; children: any[] }> {
    // Find parent by email
    const [parent] = await db
      .select()
      .from(parents)
      .where(eq(parents.email, data.email))
      .limit(1);

    if (!parent) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, parent.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Check if account is locked
    if (parent.lockedUntil && parent.lockedUntil > new Date()) {
      throw new Error('Compte temporairement verrouillé. Réessayez plus tard.');
    }

    // Get linked children
    const children = await db
      .select({
        id: students.id,
        nom: students.nom,
        prenom: students.prenom,
        niveau: students.niveauActuel
      })
      .from(students)
      .innerJoin(parentStudentRelations, eq(students.id, parentStudentRelations.studentId))
      .where(eq(parentStudentRelations.parentId, parent.id));

    // Update last login
    await db
      .update(parents)
      .set({
        lastLogin: new Date(),
        failedLoginAttempts: 0
      })
      .where(eq(parents.id, parent.id));

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
  async linkChild(parentId: number, childId: number, relationshipType: string = 'parent'): Promise<void> {
    // Check if relationship already exists
    const existingRelation = await db
      .select()
      .from(parentStudentRelations)
      .where(
        and(
          eq(parentStudentRelations.parentId, parentId),
          eq(parentStudentRelations.studentId, childId)
        )
      )
      .limit(1);

    if (existingRelation.length > 0) {
      throw new Error('Cette relation parent-enfant existe déjà');
    }

    // Verify child exists
    const [child] = await db
      .select()
      .from(students)
      .where(eq(students.id, childId))
      .limit(1);

    if (!child) {
      throw new Error('Enfant non trouvé');
    }

    // Create relationship
    await db
      .insert(parentStudentRelations)
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
  async verifyToken(token: string): Promise<ParentSession> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET!) as any;
      
      if (decoded.type !== 'parent') {
        throw new Error('Invalid token type');
      }

      // Verify parent still exists and is active
      const [parent] = await db
        .select()
        .from(parents)
        .where(eq(parents.id, decoded.id))
        .limit(1);

      if (!parent) {
        throw new Error('Parent not found');
      }

      // Get current children (in case relationships changed)
      const children = await db
        .select({
          id: students.id,
          nom: students.nom,
          prenom: students.prenom,
          niveau: students.niveauActuel
        })
        .from(students)
        .innerJoin(parentStudentRelations, eq(students.id, parentStudentRelations.studentId))
        .where(eq(parentStudentRelations.parentId, parent.id));

      return {
        id: parent.id,
        email: parent.email,
        nom: parent.nom,
        prenom: parent.prenom,
        type: 'parent',
        children
      };
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Generate JWT token for parent
   */
  private generateToken(payload: ParentSession): string {
    return jwt.sign(payload, config.JWT_SECRET!, {
      expiresIn: '7d', // Parents get longer sessions
      issuer: 'diamond-app',
      audience: 'parent-dashboard'
    });
  }

  /**
   * Get parent profile with children
   */
  async getProfile(parentId: number): Promise<{ parent: Parent; children: any[] }> {
    const [parent] = await db
      .select()
      .from(parents)
      .where(eq(parents.id, parentId))
      .limit(1);

    if (!parent) {
      throw new Error('Parent non trouvé');
    }

    const children = await db
      .select({
        id: students.id,
        nom: students.nom,
        prenom: students.prenom,
        niveau: students.niveauActuel,
        totalXP: students.xp,
        currentStreak: students.serieJours,
        lastLogin: students.dernierAcces
      })
      .from(students)
      .innerJoin(parentStudentRelations, eq(students.id, parentStudentRelations.studentId))
      .where(eq(parentStudentRelations.parentId, parentId));

    return { parent, children };
  }
}

export const parentAuthService = new ParentAuthService();