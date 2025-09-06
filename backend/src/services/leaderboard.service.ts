/**
 * 🏆 Advanced Leaderboard Service
 * 
 * Features:
 * - Real-time rankings across multiple categories
 * - Weekly/Monthly competitions
 * - Badge system with rarities
 * - Streak tracking and rewards
 * - Class-based and global leaderboards
 * - Performance analytics
 */

import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../db/connection';
import { 
  leaderboards, 
  leaderboardHistory, 
  studentBadges, 
  competitions, 
  competitionParticipants, 
  students, 
  studentProgress,
  streaks,
  type Leaderboard,
  type NewLeaderboard,
  type StudentBadge,
  type NewStudentBadge,
  type Competition,
  type CompetitionParticipant
} from '../db/schema';
import { logger } from '../utils/logger';

export interface LeaderboardEntry {
  studentId: number;
  rank: number;
  score: number;
  previousRank?: number;
  rankChange: number;
  student: {
    prenom: string;
    nom: string;
    mascotteType: string;
    mascotteColor: string;
    niveauScolaire: string;
  };
  badges: StudentBadge[];
  streak?: number;
  metadata?: any;
}

export interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  userRank?: number;
  userScore?: number;
  percentile?: number;
}

export interface BadgeDefinition {
  type: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: (stats: any) => boolean;
}

export class LeaderboardService {
  
  /**
   * 🏆 Get leaderboard for specific type and category
   */
  async getLeaderboard(
    type: 'global' | 'class' | 'weekly' | 'monthly' = 'global',
    category: 'points' | 'streak' | 'exercises' | 'accuracy' = 'points',
    options: {
      limit?: number;
      classId?: number;
      studentId?: number;
      period?: string;
    } = {}
  ): Promise<{ entries: LeaderboardEntry[]; stats: LeaderboardStats }> {
    
    const { limit = 50, classId, studentId, period } = options;
    
    try {
      // Build query conditions
      const conditions = [
        eq(leaderboards.type, type),
        eq(leaderboards.category, category)
      ];
      
      if (classId && type === 'class') {
        conditions.push(eq(leaderboards.classId, classId));
      }
      
      if (period) {
        conditions.push(eq(leaderboards.period, period));
      }
      
      // Get leaderboard entries with student info
      const entries = await db
        .select({
          leaderboard: leaderboards,
          student: {
            id: students.id,
            prenom: students.prenom,
            nom: students.nom,
            mascotteType: students.mascotteType,
            mascotteColor: students.mascotteColor,
            niveauScolaire: students.niveauScolaire
          }
        })
        .from(leaderboards)
        .innerJoin(students, eq(leaderboards.studentId, students.id))
        .where(and(...conditions))
        .orderBy(asc(leaderboards.rank))
        .limit(limit);

      // Get badges for all students in leaderboard
      const studentIds = entries.map(entry => entry.student.id);
      const badges = studentIds.length > 0 
        ? await db
            .select()
            .from(studentBadges)
            .where(inArray(studentBadges.studentId, studentIds))
        : [];

      // Get streaks if available
      const streakData = studentIds.length > 0 
        ? await db
            .select({
              studentId: streaks.studentId,
              currentStreak: streaks.currentStreak
            })
            .from(streaks)
            .where(inArray(streaks.studentId, studentIds))
        : [];

      // Format entries
      const formattedEntries: LeaderboardEntry[] = entries.map(entry => {
        const studentBadges = badges.filter(badge => badge.studentId === entry.student.id);
        const streak = streakData.find(s => s.studentId === entry.student.id);
        
        return {
          studentId: entry.leaderboard.studentId,
          rank: entry.leaderboard.rank,
          score: entry.leaderboard.score,
          previousRank: entry.leaderboard.previousRank || undefined,
          rankChange: entry.leaderboard.rankChange,
          student: entry.student,
          badges: studentBadges,
          streak: streak?.currentStreak,
          metadata: entry.leaderboard.metadata
        };
      });

      // Calculate stats
      const totalParticipants = await db
        .select({ count: sql`COUNT(*)` })
        .from(leaderboards)
        .where(and(...conditions));

      const avgScore = await db
        .select({ avg: sql`AVG(${leaderboards.score})` })
        .from(leaderboards)
        .where(and(...conditions));

      const stats: LeaderboardStats = {
        totalParticipants: Number(totalParticipants[0]?.count) || 0,
        averageScore: Math.round(Number(avgScore[0]?.avg) || 0),
        topScore: formattedEntries[0]?.score || 0
      };

      // Add user-specific stats if studentId provided
      if (studentId) {
        const userEntry = formattedEntries.find(entry => entry.studentId === studentId);
        if (userEntry) {
          stats.userRank = userEntry.rank;
          stats.userScore = userEntry.score;
          stats.percentile = Math.round(((stats.totalParticipants - userEntry.rank + 1) / stats.totalParticipants) * 100);
        }
      }

      return { entries: formattedEntries, stats };
      
    } catch (error) {
      logger.error('Error fetching leaderboard:', { type, category, error: error.message });
      return { entries: [], stats: { totalParticipants: 0, averageScore: 0, topScore: 0 } };
    }
  }

  /**
   * 📊 Update leaderboard rankings for all categories
   */
  async updateAllLeaderboards(): Promise<void> {
    try {
      logger.info('🚀 Starting leaderboard update process');

      // Update different leaderboard types
      await Promise.all([
        this.updateGlobalLeaderboards(),
        this.updateWeeklyLeaderboards(),
        this.updateMonthlyLeaderboards(),
      ]);

      // Update badges after rankings
      await this.updateBadges();

      logger.info('✅ All leaderboards updated successfully');
      
    } catch (error) {
      logger.error('❌ Error updating leaderboards:', { error: error.message });
      throw error;
    }
  }

  /**
   * 🌍 Update global leaderboards
   */
  private async updateGlobalLeaderboards(): Promise<void> {
    
    // Points Leaderboard
    await this.updateLeaderboardCategory('global', 'points', `
      SELECT 
        s.id as studentId,
        s.totalPoints as score,
        NULL as classId
      FROM students s
      WHERE s.totalPoints > 0
      ORDER BY s.totalPoints DESC
    `);

    // Streak Leaderboard
    await this.updateLeaderboardCategory('global', 'streak', `
      SELECT 
        st.studentId,
        st.currentStreak as score,
        NULL as classId
      FROM streaks st
      INNER JOIN students s ON s.id = st.studentId
      WHERE st.currentStreak > 0
      ORDER BY st.currentStreak DESC, st.longestStreak DESC
    `);

    // Exercises Completed Leaderboard
    await this.updateLeaderboardCategory('global', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1
      GROUP BY sp.studentId
      ORDER BY score DESC
    `);

    // Accuracy Leaderboard  
    await this.updateLeaderboardCategory('global', 'accuracy', `
      SELECT 
        sp.studentId,
        ROUND(AVG(sp.averageScore), 2) * 100 as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.averageScore > 0
      GROUP BY sp.studentId
      HAVING COUNT(sp.id) >= 5
      ORDER BY score DESC
    `);
  }

  /**
   * 📅 Update weekly leaderboards
   */
  private async updateWeeklyLeaderboards(): Promise<void> {
    const weekPeriod = this.getCurrentWeekPeriod();
    
    // Weekly points (from exercises completed this week)
    await this.updateLeaderboardCategory('weekly', 'points', `
      SELECT 
        sp.studentId,
        SUM(e.pointsRecompense) as score,
        NULL as classId
      FROM student_progress sp
      INNER JOIN exercises e ON e.id = sp.exerciseId
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, weekPeriod);

    // Weekly exercises
    await this.updateLeaderboardCategory('weekly', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, weekPeriod);
  }

  /**
   * 📅 Update monthly leaderboards  
   */
  private async updateMonthlyLeaderboards(): Promise<void> {
    const monthPeriod = this.getCurrentMonthPeriod();
    
    // Monthly points
    await this.updateLeaderboardCategory('monthly', 'points', `
      SELECT 
        sp.studentId,
        SUM(e.pointsRecompense) as score,
        NULL as classId
      FROM student_progress sp
      INNER JOIN exercises e ON e.id = sp.exerciseId
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, monthPeriod);

    // Monthly exercises
    await this.updateLeaderboardCategory('monthly', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, monthPeriod);
  }

  /**
   * 🔄 Update specific leaderboard category
   */
  private async updateLeaderboardCategory(
    type: string, 
    category: string, 
    query: string, 
    period?: string
  ): Promise<void> {
    try {
      // Execute raw query to get rankings
      const results = await db.execute(sql.raw(query));
      
      if (!results || (results as any).length === 0) {
        return;
      }

      // Save previous rankings for rank change calculation
      const existingEntries = await db
        .select()
        .from(leaderboards)
        .where(and(
          eq(leaderboards.type, type),
          eq(leaderboards.category, category),
          period ? eq(leaderboards.period, period) : undefined
        ));

      const previousRanks = new Map(
        existingEntries.map(entry => [entry.studentId, entry.rank])
      );

      // Clear existing entries for this category
      await db
        .delete(leaderboards)
        .where(and(
          eq(leaderboards.type, type),
          eq(leaderboards.category, category),
          period ? eq(leaderboards.period, period) : undefined
        ));

      // Insert new rankings
      const newEntries: NewLeaderboard[] = (results as any).map((result: any, index: number) => {
        const rank = index + 1;
        const previousRank = previousRanks.get(result.studentId);
        const rankChange = previousRank ? previousRank - rank : 0;

        return {
          type,
          category,
          studentId: result.studentId,
          score: result.score,
          rank,
          previousRank,
          rankChange,
          period,
          classId: result.classId || null,
          metadata: {}
        };
      });

      if (newEntries.length > 0) {
        await db.insert(leaderboards).values(newEntries);
        logger.info(`Updated ${type} ${category} leaderboard: ${newEntries.length} entries`);
      }

    } catch (error) {
      logger.error(`Error updating ${type} ${category} leaderboard:`, { error: error.message });
    }
  }

  /**
   * 🏅 Badge System - Update badges based on achievements
   */
  async updateBadges(): Promise<void> {
    try {
      const badgeDefinitions = this.getBadgeDefinitions();
      
      // Get all students
      const allStudents = await db.select().from(students);
      
      for (const student of allStudents) {
        await this.updateStudentBadges(student.id, badgeDefinitions);
      }
      
      logger.info('✅ All badges updated');
      
    } catch (error) {
      logger.error('❌ Error updating badges:', { error: error.message });
    }
  }

  /**
   * 🎖️ Update badges for a specific student
   */
  private async updateStudentBadges(studentId: number, badgeDefinitions: BadgeDefinition[]): Promise<void> {
    try {
      // Get student stats for badge evaluation
      const stats = await this.getStudentStats(studentId);
      
      for (const badge of badgeDefinitions) {
        const shouldHaveBadge = badge.criteria(stats);
        const hasBadge = await this.studentHasBadge(studentId, badge.type);
        
        if (shouldHaveBadge && !hasBadge) {
          // Award new badge
          await db.insert(studentBadges).values({
            studentId,
            badgeType: badge.type,
            title: badge.title,
            description: badge.description,
            icon: badge.icon,
            rarity: badge.rarity,
            metadata: {}
          });
          
          logger.info(`🏅 Badge awarded: ${badge.title} to student ${studentId}`);
        }
      }
      
    } catch (error) {
      logger.error(`Error updating badges for student ${studentId}:`, { error: error.message });
    }
  }

  /**
   * 📈 Get comprehensive student stats for badge evaluation
   */
  private async getStudentStats(studentId: number): Promise<any> {
    try {
      // Get basic student info
      const student = await db
        .select()
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      if (student.length === 0) return {};

      // Get streak info
      const streak = await db
        .select()
        .from(streaks)
        .where(eq(streaks.studentId, studentId))
        .limit(1);

      // Get progress stats
      const progressStats = await db
        .select({
          totalExercises: count(),
          completedExercises: sql<number>`SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END)`.mapWith(Number),
          averageScore: avg(studentProgress.score),
          totalTimeSpent: sum(studentProgress.timeSpent)
        })
        .from(studentProgress)
        .where(eq(studentProgress.studentId, studentId));

      // Get leaderboard positions
      const leaderboardPositions = await db
        .select()
        .from(leaderboards)
        .where(eq(leaderboards.studentId, studentId));

      return {
        student: student[0],
        streak: streak[0],
        progress: progressStats[0],
        leaderboardPositions,
        totalPoints: student[0].totalPoints,
        currentStreak: streak[0]?.currentStreak || 0,
        longestStreak: streak[0]?.longestStreak || 0,
        completionRate: progressStats[0] ? 
          (Number(progressStats[0].completedExercises) / Number(progressStats[0].totalExercises)) * 100 : 0
      };
      
    } catch (error) {
      logger.error(`Error getting student stats for ${studentId}:`, { error: error.message });
      return {};
    }
  }

  /**
   * 🏅 Badge Definitions - Criteria for earning badges
   */
  private getBadgeDefinitions(): BadgeDefinition[] {
    return [
      {
        type: 'first_place_global',
        title: '👑 Champion Mondial',
        description: 'Numéro 1 du classement mondial !',
        icon: '👑',
        rarity: 'legendary',
        criteria: (stats) => stats.leaderboardPositions?.some((pos: any) => 
          pos.type === 'global' && pos.rank === 1
        )
      },
      {
        type: 'top_10_global',
        title: '🏆 Top 10 Mondial',
        description: 'Parmi les 10 meilleurs au monde !',
        icon: '🏆',
        rarity: 'epic',
        criteria: (stats) => stats.leaderboardPositions?.some((pos: any) => 
          pos.type === 'global' && pos.rank <= 10
        )
      },
      {
        type: 'streak_master_7',
        title: '🔥 Maître des Séries - 7 jours',
        description: '7 jours consécutifs d\'apprentissage !',
        icon: '🔥',
        rarity: 'rare',
        criteria: (stats) => stats.currentStreak >= 7
      },
      {
        type: 'streak_master_30',
        title: '⚡ Légende des Séries - 30 jours',
        description: '30 jours consécutifs ! Incroyable !',
        icon: '⚡',
        rarity: 'legendary',
        criteria: (stats) => stats.currentStreak >= 30
      },
      {
        type: 'speed_demon',
        title: '💨 Démon de Vitesse',
        description: '50 exercices complétés en une semaine !',
        icon: '💨',
        rarity: 'epic',
        criteria: (stats) => {
          // This would need weekly exercise count logic
          return false; // Placeholder
        }
      },
      {
        type: 'perfectionist',
        title: '⭐ Perfectionniste',
        description: '95%+ de précision sur 50+ exercices !',
        icon: '⭐',
        rarity: 'epic',
        criteria: (stats) => stats.completionRate >= 95 && 
          Number(stats.progress?.completedExercises) >= 50
      },
      {
        type: 'dedicated_learner',
        title: '📚 Apprenant Dévoué',
        description: '100 exercices complétés !',
        icon: '📚',
        rarity: 'rare',
        criteria: (stats) => Number(stats.progress?.completedExercises) >= 100
      },
      {
        type: 'point_collector',
        title: '💎 Collectionneur de Points',
        description: '1000 points accumulés !',
        icon: '💎',
        rarity: 'rare',
        criteria: (stats) => stats.totalPoints >= 1000
      }
    ];
  }

  /**
   * 🔍 Check if student has specific badge
   */
  private async studentHasBadge(studentId: number, badgeType: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(studentBadges)
      .where(and(
        eq(studentBadges.studentId, studentId),
        eq(studentBadges.badgeType, badgeType)
      ))
      .limit(1);
      
    return existing.length > 0;
  }

  /**
   * 📅 Utility functions for periods
   */
  private getCurrentWeekPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = this.getWeekNumber(now);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private getCurrentMonthPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  }

  /**
   * 🏆 Get student's rank and position in specific leaderboard
   */
  async getStudentRank(
    studentId: number, 
    type: string = 'global', 
    category: string = 'points'
  ): Promise<{ rank: number; score: number; totalParticipants: number } | null> {
    
    try {
      const entry = await db
        .select()
        .from(leaderboards)
        .where(and(
          eq(leaderboards.studentId, studentId),
          eq(leaderboards.type, type),
          eq(leaderboards.category, category)
        ))
        .limit(1);

      if (entry.length === 0) return null;

      const totalParticipants = await db
        .select({ count: sql`COUNT(*)` })
        .from(leaderboards)
        .where(and(
          eq(leaderboards.type, type),
          eq(leaderboards.category, category)
        ));

      return {
        rank: entry[0].rank,
        score: entry[0].score,
        totalParticipants: Number(totalParticipants[0]?.count) || 0
      };
      
    } catch (error) {
      logger.error('Error getting student rank:', { studentId, type, category, error: error.message });
      return null;
    }
  }

  /**
   * 🎯 Get user-centric leaderboard view (user + nearby competitors)
   */
  async getUserCentricLeaderboard(
    studentId: number,
    type: string = 'global',
    category: string = 'points',
    range: number = 3
  ): Promise<{
    userEntry: LeaderboardEntry | null;
    competitors: LeaderboardEntry[];
    context: {
      totalParticipants: number;
      userRank: number;
      percentile: number;
      beatingCount: number;
      nextTarget?: LeaderboardEntry;
    };
  }> {
    
    try {
      const studentRank = await this.getStudentRank(studentId, type, category);
      if (!studentRank) {
        return {
          userEntry: null,
          competitors: [],
          context: {
            totalParticipants: 0,
            userRank: 0,
            percentile: 0,
            beatingCount: 0
          }
        };
      }

      const startRank = Math.max(1, studentRank.rank - range);
      const endRank = studentRank.rank + range;

      // Get the leaderboard section around the user
      const conditions = [
        eq(leaderboards.type, type),
        eq(leaderboards.category, category),
        gte(leaderboards.rank, startRank),
        lte(leaderboards.rank, endRank)
      ];

      const entries = await db
        .select({
          leaderboard: leaderboards,
          student: {
            id: students.id,
            prenom: students.prenom,
            nom: students.nom,
            mascotteType: students.mascotteType,
            mascotteColor: students.mascotteColor,
            niveauScolaire: students.niveauScolaire
          }
        })
        .from(leaderboards)
        .innerJoin(students, eq(leaderboards.studentId, students.id))
        .where(and(...conditions))
        .orderBy(asc(leaderboards.rank));

      // Get badges for all students
      const studentIds = entries.map(entry => entry.student.id);
      const badges = studentIds.length > 0 
        ? await db
            .select()
            .from(studentBadges)
            .where(inArray(studentBadges.studentId, studentIds))
        : [];

      // Format entries
      const formattedEntries: LeaderboardEntry[] = entries.map(entry => {
        const studentBadges = badges.filter(badge => badge.studentId === entry.student.id);
        
        return {
          studentId: entry.leaderboard.studentId,
          rank: entry.leaderboard.rank,
          score: entry.leaderboard.score,
          previousRank: entry.leaderboard.previousRank || undefined,
          rankChange: entry.leaderboard.rankChange,
          student: entry.student,
          badges: studentBadges,
          metadata: entry.leaderboard.metadata
        };
      });

      const userEntry = formattedEntries.find(entry => entry.studentId === studentId);
      const competitors = formattedEntries.filter(entry => entry.studentId !== studentId);
      
      // Find next target (person directly above user)
      const nextTarget = formattedEntries.find(entry => 
        entry.rank === studentRank.rank - 1
      );

      // Calculate context
      const percentile = Math.round(((studentRank.totalParticipants - studentRank.rank + 1) / studentRank.totalParticipants) * 100);
      const beatingCount = studentRank.totalParticipants - studentRank.rank;

      return {
        userEntry,
        competitors,
        context: {
          totalParticipants: studentRank.totalParticipants,
          userRank: studentRank.rank,
          percentile,
          beatingCount,
          nextTarget
        }
      };
      
    } catch (error) {
      logger.error('Error getting user-centric leaderboard:', { studentId, error: error.message });
      return {
        userEntry: null,
        competitors: [],
        context: {
          totalParticipants: 0,
          userRank: 0,
          percentile: 0,
          beatingCount: 0
        }
      };
    }
  }

  /**
   * 🎯 Get nearby competitors (students close in ranking)
   */
  async getNearbyCompetitors(
    studentId: number,
    type: 'global' | 'class' | 'weekly' | 'monthly' = 'global',
    category: 'points' | 'streak' | 'exercises' | 'accuracy' = 'points',
    range: number = 5
  ): Promise<LeaderboardEntry[]> {
    
    try {
      const studentRank = await this.getStudentRank(studentId, type, category);
      if (!studentRank) return [];

      const startRank = Math.max(1, studentRank.rank - range);
      const endRank = studentRank.rank + range;

      const { entries } = await this.getLeaderboard(type, category, {
        studentId
      });

      return entries.filter(entry => 
        entry.rank >= startRank && entry.rank <= endRank
      );
      
    } catch (error) {
      logger.error('Error getting nearby competitors:', { studentId, error: error.message });
      return [];
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();