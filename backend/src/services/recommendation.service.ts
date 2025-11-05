import { db } from '../db/connection';
import * as schema from '../db/schema';
import { eq, and, sql, not, desc } from 'drizzle-orm';
import type { Exercise } from '../db/schema';

export class RecommendationService {
  async getRecommendedExercises(studentId: number, limit: number = 5): Promise<any[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      // Get exercises the student has already completed
      const completedExercises = await db
        .select({ exerciseId: schema.studentProgress.exerciseId })
        .from(schema.studentProgress)
        .where(and(
          eq(schema.studentProgress.studentId, studentId),
          eq(schema.studentProgress.completed, true)
        ));

      const completedIds = completedExercises.map(p => p.exerciseId);

      // Get recommended exercises based on student's niveau
      const whereConditions = [
        eq(schema.exercises.difficulte, student[0].niveauActuel),
        // exercises are active by default - removed estActif check
      ];

      // Exclude completed exercises if any exist
      if (completedIds.length > 0) {
        whereConditions.push(not(sql`${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
      }

      const recommendedExercises = await db
        .select()
        .from(schema.exercises)
        .where(and(...whereConditions))
        .orderBy(sql`RAND()`)
        .limit(limit);

      return recommendedExercises;
    } catch (error) {
      console.error('Error getting recommended exercises:', error);
      return [];
    }
  }

  async getNextExercise(studentId: number, moduleId?: number): Promise<Exercise | null> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return null;
      }

      // Get exercises the student has already completed
      const completedExercises = await db
        .select({ exerciseId: schema.studentProgress.exerciseId })
        .from(schema.studentProgress)
        .where(and(
          eq(schema.studentProgress.studentId, studentId),
          eq(schema.studentProgress.completed, true)
        ));

      const completedIds = completedExercises.map(p => p.exerciseId);

      // Build where conditions
      const whereConditions = [
        eq(schema.exercises.difficulte, student[0].niveauActuel),
        // exercises are active by default - removed estActif check
      ];

      // Add module filter if specified
      if (moduleId) {
        whereConditions.push(eq(schema.exercises.ordre, moduleId));
      }

      // Exclude completed exercises if any exist
      if (completedIds.length > 0) {
        whereConditions.push(not(sql`${schema.exercises.id} IN (${completedIds.map(() => '?').join(',')})`));
      }

      const nextExercise = await db
        .select()
        .from(schema.exercises)
        .where(and(...whereConditions))
        .orderBy(schema.exercises.id)
        .limit(1);

      return nextExercise[0] || null;
    } catch (error) {
      console.error('Error getting next exercise:', error);
      return null;
    }
  }

  async recordExerciseAttempt(data: {
    studentId: number;
    exerciseId: number;
    score: number;
    completed: boolean;
    timeSpent?: number;
  }): Promise<boolean> {
    try {
      // Check if progress record exists
      const existingProgress = await db
        .select()
        .from(schema.studentProgress)
        .where(and(
          eq(schema.studentProgress.studentId, data.studentId),
          eq(schema.studentProgress.exerciseId, data.exerciseId)
        ))
        .limit(1);

      const pointsGagnes = data.completed ? Math.round(data.score) : 0;

      if (existingProgress[0]) {
        // Update existing progress
        await db
          .update(schema.studentProgress)
          .set({
            completed: data.completed,
            totalAttempts: sql`total_attempts + 1`,
            successfulAttempts: data.completed ? sql`successful_attempts + 1` : sql`successful_attempts`,
            timeSpent: sql`time_spent + ${data.timeSpent || 0}`,
            averageScore: sql`(average_score + ${Math.round(data.score)}) / 2`,
            bestScore: sql`GREATEST(best_score, ${Math.round(data.score)})`,
            completedAt: data.completed && !(existingProgress[0] as any).completedAt ? new Date() : (existingProgress[0] as any).completedAt,
            updatedAt: new Date(),
          })
          .where(and(
            eq(schema.studentProgress.studentId, data.studentId),
            eq(schema.studentProgress.exerciseId, data.exerciseId)
          ));
      } else {
        // Create new progress record
        const newProgress: any = {
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

        await db.insert(schema.studentProgress).values(newProgress);
      }

      // Update student's total points if completed
      if (data.completed) {
        await db
          .update(schema.students)
          .set({
            totalPoints: sql`total_points + ${pointsGagnes}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.students.id, data.studentId));
      }

      return true;
    } catch (error) {
      console.error('Error recording exercise attempt:', error);
      return false;
    }
  }

  async getExercisesByDifficulty(studentId: number, difficulte: 'FACILE' | 'MOYEN' | 'DIFFICILE'): Promise<Exercise[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      const exercises = await db
        .select()
        .from(schema.exercises)
        .where(and(
          eq(schema.exercises.difficulte, student[0].niveauActuel),
          eq(schema.exercises.difficulte, difficulte),
          // exercises are active by default - removed estActif check
        ))
        .orderBy(schema.exercises.id);

      return exercises;
    } catch (error) {
      console.error('Error getting exercises by difficulty:', error);
      return [];
    }
  }

  async getExercisesBySubject(studentId: number, matiere: string): Promise<Exercise[]> {
    try {
      const student = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, studentId))
        .limit(1);

      if (!student[0]) {
        return [];
      }

      const exercises = await db
        .select()
        .from(schema.exercises)
        .where(and(
          eq(schema.exercises.difficulte, student[0].niveauActuel),
          eq(schema.exercises.matiere, matiere),
          // exercises are active by default - removed estActif check
        ))
        .orderBy(schema.exercises.id);

      return exercises;
    } catch (error) {
      console.error('Error getting exercises by subject:', error);
      return [];
    }
  }

  async getStudentWeaknesses(studentId: number): Promise<{
    matiere: string;
    difficulte: string;
    count: number;
  }[]> {
    try {
      // Get exercises where student failed or struggled
      const weakAreas = await db
        .select({
          matiere: schema.exercises.matiere,
          difficulte: schema.exercises.difficulte,
          count: sql<number>`count(*)`,
        })
        .from(schema.studentProgress)
        .innerJoin(schema.exercises, eq(schema.studentProgress.exerciseId, schema.exercises.id))
        .where(and(
          eq(schema.studentProgress.studentId, studentId),
          eq(schema.studentProgress.completed, false)
        ))
        .groupBy(schema.exercises.matiere, schema.exercises.difficulte)
        .orderBy(desc(sql`count(*)`));

      return weakAreas.map(area => ({
        matiere: area.matiere,
        difficulte: area.difficulte,
        count: Number(area.count),
      }));
    } catch (error) {
      console.error('Error getting student weaknesses:', error);
      return [];
    }
  }

  async getPersonalizedRecommendations(studentId: number, limit: number = 10): Promise<Exercise[]> {
    try {
      const weaknesses = await this.getStudentWeaknesses(studentId);
      
      if (weaknesses.length === 0) {
        // If no weaknesses, recommend based on current level
        return await this.getRecommendedExercises(studentId, limit);
      }

      // Focus on weakest areas
      const recommendations: Exercise[] = [];
      
      for (const weakness of weaknesses.slice(0, 3)) { // Top 3 weak areas
        const exercises = await db
          .select()
          .from(schema.exercises)
          .where(and(
            eq(schema.exercises.matiere, weakness.matiere),
            eq(schema.exercises.difficulte, weakness.difficulte as 'FACILE' | 'MOYEN' | 'DIFFICILE'),
            // exercises are active by default - removed estActif check
          ))
          .orderBy(sql`RAND()`)
          .limit(Math.ceil(limit / 3));

        recommendations.push(...exercises);
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }
}

export const recommendationService = new RecommendationService();
