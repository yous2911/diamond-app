

import { mysqlTable, varchar, int, decimal, timestamp, text, boolean, json, date } from 'drizzle-orm/mysql-core';
import { InferInsertModel, InferSelectModel, relations, sql } from 'drizzle-orm';

// =============================================================================
// CORE TABLES
// =============================================================================

// Students table
export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  prenom: varchar('prenom', { length: 100 }).notNull(),
  nom: varchar('nom', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  dateNaissance: date('date_naissance').notNull(),
  niveauActuel: varchar('niveau_actuel', { length: 20 }).notNull(),
  totalPoints: int('total_points').default(0),
  xp: int('xp').default(0),
  serieJours: int('serie_jours').default(0),
  mascotteType: varchar('mascotte_type', { length: 50 }).default('dragon'),
  dernierAcces: timestamp('dernier_acces'),
  estConnecte: boolean('est_connecte').default(false),
  failedLoginAttempts: int('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  niveauScolaire: varchar('niveau_scolaire', { length: 20 }).notNull(),
  mascotteColor: varchar('mascotte_color', { length: 20 }).default('#ff6b35'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Exercises table
export const exercises = mysqlTable('exercises', {
  id: int('id').primaryKey().autoincrement(),
  titre: varchar('titre', { length: 200 }).notNull(),
  description: text('description'),
  matiere: varchar('matiere', { length: 50 }).notNull(),
  niveau: varchar('niveau', { length: 20 }).notNull(),
  difficulte: varchar('difficulte', { length: 30 }).notNull(),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  prerequis: json('prerequis'),
  contenu: json('contenu').notNull(),
  solution: json('solution').notNull(),
  pointsRecompense: int('points_recompense').default(10),
  tempsEstime: int('temps_estime').default(300),
  typeExercice: varchar('type_exercice', { length: 30 }).notNull(),
  xp: int('xp').default(10),
  configuration: json('configuration'),
  ordre: int('ordre').default(0),
  estActif: boolean('est_actif').default(true),
  metadonnees: json('metadonnees'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Student Progress table
export const studentProgress = mysqlTable('student_progress', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  exerciseId: int('exercise_id').notNull().references(() => exercises.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  progressPercent: decimal('progress_percent', { precision: 5, scale: 2 }).default('0.00'),
  masteryLevel: varchar('mastery_level', { length: 20 }).notNull().default('not_started'),
  totalAttempts: int('total_attempts').default(0),
  successfulAttempts: int('successful_attempts').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  bestScore: decimal('best_score', { precision: 5, scale: 2 }).default('0.00'),
  totalTimeSpent: int('total_time_spent').default(0),
  timeSpent: int('time_spent').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  masteredAt: timestamp('mastered_at'),
  needsReview: boolean('needs_review').default(false),
  reviewScheduledAt: timestamp('review_scheduled_at'),
  streakCount: int('streak_count').default(0),
  difficultyPreference: varchar('difficulty_preference', { length: 30 }),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Student Learning Path table
export const studentLearningPath = mysqlTable('student_learning_path', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  currentLevel: varchar('current_level', { length: 20 }).notNull().default('decouverte'),
  targetLevel: varchar('target_level', { length: 20 }).notNull().default('maitrise'),
  status: varchar('status', { length: 20 }).notNull().default('available'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  recommendedDifficulty: varchar('recommended_difficulty', { length: 30 }).notNull().default('decouverte'),
  estimatedCompletionTime: int('estimated_completion_time'),
  personalizedOrder: int('personalized_order').default(0),
  isBlocked: boolean('is_blocked').default(false),
  blockingReasons: json('blocking_reasons'),
  unlockedAt: timestamp('unlocked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Sessions table
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  studentId: int('student_id').references(() => students.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Revisions table
export const revisions = mysqlTable('revisions', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  exerciseId: int('exercise_id').references(() => exercises.id),
  revisionDate: date('revision_date').notNull(),
  score: int('score').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Modules table
export const modules = mysqlTable('modules', {
  id: int('id').primaryKey().autoincrement(),
  titre: varchar('titre', { length: 200 }).notNull(),
  matiere: varchar('matiere', { length: 50 }).notNull(),
  niveau: varchar('niveau', { length: 20 }).notNull(),
  ordre: int('ordre').default(0),
  estActif: boolean('est_actif').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;
export type Exercise = InferSelectModel<typeof exercises>;
export type NewExercise = InferInsertModel<typeof exercises>;
export type StudentProgress = InferSelectModel<typeof studentProgress>;
export type NewStudentProgress = InferInsertModel<typeof studentProgress>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Revision = InferSelectModel<typeof revisions>;
export type NewRevision = InferInsertModel<typeof revisions>;
export type Module = InferSelectModel<typeof modules>;
export type NewModule = InferInsertModel<typeof modules>;

// =============================================================================
// RELATIONS
// =============================================================================

export const studentsRelations = relations(students, ({ many }) => ({
  progress: many(studentProgress),
  sessions: many(sessions),
  revisions: many(revisions),
  learningPath: many(studentLearningPath)
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  progress: many(studentProgress),
  revisions: many(revisions)
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(students, {
    fields: [studentProgress.studentId],
    references: [students.id]
  }),
  exercise: one(exercises, {
    fields: [studentProgress.exerciseId],
    references: [exercises.id]
  })
}));

// =============================================================================
// GDPR & COMPLIANCE TABLES
// =============================================================================

// GDPR Consent Requests table
export const gdprConsentRequests = mysqlTable('gdpr_consent_requests', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  consentType: varchar('consent_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  requestToken: varchar('request_token', { length: 255 }),
  requestType: varchar('request_type', { length: 50 }),
  expiresAt: timestamp('expires_at'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Audit Logs table
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  userId: varchar('user_id', { length: 36 }),
  parentId: varchar('parent_id', { length: 36 }),
  studentId: varchar('student_id', { length: 36 }),
  details: json('details').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  category: varchar('category', { length: 50 }),
  sessionId: varchar('session_id', { length: 100 }),
  correlationId: varchar('correlation_id', { length: 36 }),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  encrypted: boolean('encrypted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// GDPR Files table
export const gdprFiles = mysqlTable('gdpr_files', {
  id: varchar('id', { length: 36 }).primaryKey(),
  studentId: int('student_id').references(() => students.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileHash: varchar('file_hash', { length: 64 }),
  encrypted: boolean('encrypted').default(false),
  retentionDate: timestamp('retention_date'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// GDPR Data Processing Log table  
export const gdprDataProcessingLog = mysqlTable('gdpr_data_processing_log', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  action: varchar('action', { length: 100 }).notNull(),
  dataType: varchar('data_type', { length: 50 }),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Type exports
export type NewGdprDataProcessingLog = typeof gdprDataProcessingLog.$inferInsert;

// =============================================================================
// STREAK PSYCHOLOGY & GAMIFICATION TABLES
// =============================================================================

// Student Streaks table
export const streaks = mysqlTable('streaks', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  currentStreak: int('current_streak').default(0),
  longestStreak: int('longest_streak').default(0),
  lastActivityDate: timestamp('last_activity_date').notNull().defaultNow(),
  streakFreezes: int('streak_freezes').default(0),
  weeklyGoal: int('weekly_goal').default(5), // days per week
  streakSafeUntil: timestamp('streak_safe_until'),
  emotionalState: varchar('emotional_state', { length: 20 }).default('cold'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Streak Freezes Usage Log table
export const streakFreezes = mysqlTable('streak_freezes', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  usedAt: timestamp('used_at').notNull().defaultNow(),
  protectedStreak: int('protected_streak').notNull(),
  reason: varchar('reason', { length: 50 }).default('manual_use'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Daily Goals table
export const dailyGoals = mysqlTable('daily_goals', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  goalDate: date('goal_date').notNull(),
  targetExercises: int('target_exercises').default(3),
  completedExercises: int('completed_exercises').default(0),
  goalMet: boolean('goal_met').default(false),
  studyTimeMinutes: int('study_time_minutes').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Spaced Repetition table
export const spacedRepetition = mysqlTable('spaced_repetition', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  exerciseId: int('exercise_id').notNull().references(() => exercises.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  
  // SuperMemo-2 Algorithm parameters
  easinessFactor: decimal('easiness_factor', { precision: 3, scale: 2 }).default('2.5'),
  repetitionNumber: int('repetition_number').default(0),
  intervalDays: int('interval_days').default(1),
  
  // Scheduling
  nextReviewDate: timestamp('next_review_date').notNull(),
  lastReviewDate: timestamp('last_review_date'),
  
  // Performance tracking
  correctAnswers: int('correct_answers').default(0),
  totalReviews: int('total_reviews').default(0),
  averageResponseTime: int('average_response_time').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  priority: varchar('priority', { length: 20 }).default('normal'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Push Notifications table
export const pushNotifications = mysqlTable('push_notifications', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  deviceToken: varchar('device_token', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 20 }).notNull(), // 'ios', 'android', 'web'
  
  // Notification preferences
  streakReminders: boolean('streak_reminders').default(true),
  dailyGoalReminders: boolean('daily_goal_reminders').default(true),
  spacedRepetitionReminders: boolean('spaced_repetition_reminders').default(true),
  achievementNotifications: boolean('achievement_notifications').default(true),
  
  // Timing preferences
  reminderTime: varchar('reminder_time', { length: 8 }).default('19:00'), // HH:MM format
  timeZone: varchar('time_zone', { length: 50 }).default('Europe/Paris'),
  
  // Quiet hours
  quietHoursStart: varchar('quiet_hours_start', { length: 8 }).default('22:00'),
  quietHoursEnd: varchar('quiet_hours_end', { length: 8 }).default('08:00'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Type exports for new tables
export type Streak = InferSelectModel<typeof streaks>;
export type NewStreak = InferInsertModel<typeof streaks>;
export type StreakFreeze = InferSelectModel<typeof streakFreezes>;
export type NewStreakFreeze = InferInsertModel<typeof streakFreezes>;
export type DailyGoal = InferSelectModel<typeof dailyGoals>;
export type NewDailyGoal = InferInsertModel<typeof dailyGoals>;
export type SpacedRepetition = InferSelectModel<typeof spacedRepetition>;
export type NewSpacedRepetition = InferInsertModel<typeof spacedRepetition>;
export type PushNotification = InferSelectModel<typeof pushNotifications>;
export type NewPushNotification = InferInsertModel<typeof pushNotifications>;

// Analytics tables
export const dailyLearningAnalytics = mysqlTable('daily_learning_analytics', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  date: date('date').notNull(),
  exercisesCompleted: int('exercises_completed').default(0),
  timeSpent: int('time_spent').default(0),
  totalTimeMinutes: int('total_time_minutes').default(0),
  totalExercises: int('total_exercises').default(0),
  completedExercises: int('completed_exercises').default(0),
  avgScore: decimal('avg_score', { precision: 5, scale: 2 }).default('0.00'),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  competencesWorked: int('competences_worked').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const weeklyProgressSummary = mysqlTable('weekly_progress_summary', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  weekStart: date('week_start').notNull(),
  totalExercises: int('total_exercises').default(0),
  completedExercises: int('completed_exercises').default(0),
  totalTimeSpent: int('total_time_spent').default(0),
  avgScore: decimal('avg_score', { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const studentCompetenceProgress = mysqlTable('student_competence_progress', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  progressPercent: decimal('progress_percent', { precision: 5, scale: 2 }).default('0.00'),
  masteryLevel: varchar('mastery_level', { length: 20 }).default('not_started'),
  currentScore: decimal('current_score', { precision: 5, scale: 2 }).default('0.00'),
  totalAttempts: int('total_attempts').default(0),
  successfulAttempts: int('successful_attempts').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const learningSessionTracking = mysqlTable('learning_session_tracking', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  sessionStart: timestamp('session_start').notNull(),
  sessionEnd: timestamp('session_end'),
  exercisesCompleted: int('exercises_completed').default(0),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  focusTime: int('focus_time').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const exercisePerformanceAnalytics = mysqlTable('exercise_performance_analytics', {
  id: int('id').primaryKey().autoincrement(),
  exerciseId: int('exercise_id').notNull().references(() => exercises.id),
  totalAttempts: int('total_attempts').default(0),
  successfulAttempts: int('successful_attempts').default(0),
  avgCompletionTime: int('avg_completion_time').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const studentAchievements = mysqlTable('student_achievements', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  achievementCode: varchar('achievement_code', { length: 50 }).notNull(),
  badgeIcon: varchar('badge_icon', { length: 255 }),
  achievementType: varchar('achievement_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  xpReward: int('xp_reward').default(10),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Leaderboard Tables
export const leaderboards = mysqlTable('leaderboards', {
  id: int('id').primaryKey().autoincrement(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  studentId: int('student_id').notNull().references(() => students.id),
  score: int('score').notNull(),
  rank: int('rank').notNull(),
  previousRank: int('previous_rank'),
  rankChange: int('rank_change').default(0),
  period: varchar('period', { length: 20 }),
  classId: int('class_id'),
  metadata: json('metadata'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow().onUpdateNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const leaderboardHistory = mysqlTable('leaderboard_history', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  leaderboardType: varchar('leaderboard_type', { length: 50 }).notNull(),
  rank: int('rank').notNull(),
  score: int('score').notNull(),
  period: varchar('period', { length: 20 }).notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow()
});

export const studentBadges = mysqlTable('student_badges', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').notNull().references(() => students.id),
  badgeType: varchar('badge_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  rarity: varchar('rarity', { length: 20 }).default('common'),
  earnedAt: timestamp('earned_at').notNull().defaultNow(),
  validUntil: timestamp('valid_until'),
  metadata: json('metadata')
});

export const competitions = mysqlTable('competitions', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  rules: json('rules'),
  rewards: json('rewards'),
  isActive: boolean('is_active').default(true),
  participants: int('participants').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const competitionParticipants = mysqlTable('competition_participants', {
  id: int('id').primaryKey().autoincrement(),
  competitionId: int('competition_id').notNull().references(() => competitions.id),
  studentId: int('student_id').notNull().references(() => students.id),
  score: int('score').default(0),
  rank: int('rank'),
  progress: json('progress'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  lastActivity: timestamp('last_activity').notNull().defaultNow().onUpdateNow()
});

// Competence prerequisites table
export const competencePrerequisites = mysqlTable('competence_prerequisites', {
  id: int('id').primaryKey().autoincrement(),
  competenceCode: varchar('competence_code', { length: 20 }).notNull(),
  prerequisiteCode: varchar('prerequisite_code', { length: 20 }).notNull(),
  required: boolean('required').default(true),
  minimumLevel: varchar('minimum_level', { length: 20 }).default('decouverte'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// GDPR type exports  
export const gdprRequests = mysqlTable('gdpr_requests', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  requestType: varchar('request_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const retentionPolicies = mysqlTable('retention_policies', {
  id: varchar('id', { length: 36 }).primaryKey(),
  policyName: varchar('policy_name', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  retentionPeriodDays: int('retention_period_days').notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const retentionSchedules = mysqlTable('retention_schedules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }).notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const consentPreferences = mysqlTable('consent_preferences', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  consentType: varchar('consent_type', { length: 50 }).notNull(),
  granted: boolean('granted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Parents table
export const parents = mysqlTable('parents', {
  id: int('id').primaryKey().autoincrement(),
  nom: varchar('nom', { length: 100 }).notNull(),
  prenom: varchar('prenom', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  telephone: varchar('telephone', { length: 20 }),
  dateNaissance: date('date_naissance'),
  profession: varchar('profession', { length: 100 }),
  
  // Account settings
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  
  // Security
  failedLoginAttempts: int('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  lastLogin: timestamp('last_login'),
  
  // Notifications preferences
  dailyReportEnabled: boolean('daily_report_enabled').default(true),
  weeklyReportEnabled: boolean('weekly_report_enabled').default(true),
  achievementNotificationsEnabled: boolean('achievement_notifications_enabled').default(true),
  progressAlertsEnabled: boolean('progress_alerts_enabled').default(true),
  
  // Communication preferences  
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('fr'),
  timeZone: varchar('time_zone', { length: 50 }).default('Europe/Paris'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// Parent-Student relationships
export const parentStudentRelations = mysqlTable('parent_student_relations', {
  id: int('id').primaryKey().autoincrement(),
  parentId: int('parent_id').notNull().references(() => parents.id),
  studentId: int('student_id').notNull().references(() => students.id),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull().default('parent'), // parent, guardian, tutor
  isPrimaryContact: boolean('is_primary_contact').default(false),
  canViewProgress: boolean('can_view_progress').default(true),
  canManageAccount: boolean('can_manage_account').default(true),
  canReceiveReports: boolean('can_receive_reports').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const parentalConsent = mysqlTable('parental_consent', {
  id: int('id').primaryKey().autoincrement(),
  studentId: int('student_id').references(() => students.id),
  parentId: int('parent_id').references(() => parents.id),
  parentName: varchar('parent_name', { length: 200 }).notNull(),
  parentEmail: varchar('parent_email', { length: 255 }).notNull(),
  consentGiven: boolean('consent_given').default(false),
  consentDate: timestamp('consent_date'),
  consentType: varchar('consent_type', { length: 50 }).notNull().default('general'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const encryptionKeys = mysqlTable('encryption_keys', {
  id: varchar('id', { length: 36 }).primaryKey(),
  keyType: varchar('key_type', { length: 50 }).notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Add MasteryLevels export
export const MasteryLevels = {
  NOT_STARTED: 'not_started',
  DECOUVERTE: 'decouverte',
  EN_COURS: 'en_cours',
  MAITRISE: 'maitrise',
  EXPERT: 'expert'
} as const;

export const securityAlerts = mysqlTable('security_alerts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  studentId: int('student_id').references(() => students.id),
  type: varchar('type', { length: 50 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 50 }).notNull(),
  message: text('message').notNull(),
  description: text('description'),
  isResolved: boolean('is_resolved').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const complianceReports = mysqlTable('compliance_reports', {
  id: int('id').primaryKey().autoincrement(),
  reportType: varchar('report_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  data: json('data'),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const files = mysqlTable('files', {
  id: varchar('id', { length: 36 }).primaryKey(),
  studentId: int('student_id').references(() => students.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  uploadedBy: varchar('uploaded_by', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active'),
  category: varchar('category', { length: 50 }).default('general'),
  isPublic: boolean('is_public').default(false),
  checksum: varchar('checksum', { length: 64 }),
  url: varchar('url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

export const fileVariants = mysqlTable('file_variants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  originalFileId: varchar('original_file_id', { length: 36 }).notNull().references(() => files.id),
  variantType: varchar('variant_type', { length: 50 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: int('file_size').notNull(),
  url: varchar('url', { length: 500 }),
  metadata: json('metadata'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Type exports for missing tables
export type SecurityAlert = InferSelectModel<typeof securityAlerts>;
export type NewSecurityAlert = InferInsertModel<typeof securityAlerts>;
export type ComplianceReport = InferSelectModel<typeof complianceReports>;
export type NewComplianceReport = InferInsertModel<typeof complianceReports>;
export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;
export type FileVariant = InferSelectModel<typeof fileVariants>;
export type NewFileVariant = InferInsertModel<typeof fileVariants>;

// Analytics type exports
export type DailyLearningAnalytics = InferSelectModel<typeof dailyLearningAnalytics>;
export type NewDailyLearningAnalytics = InferInsertModel<typeof dailyLearningAnalytics>;
export type WeeklyProgressSummary = InferSelectModel<typeof weeklyProgressSummary>;
export type NewWeeklyProgressSummary = InferInsertModel<typeof weeklyProgressSummary>;
export type StudentCompetenceProgress = InferSelectModel<typeof studentCompetenceProgress>;
export type NewStudentCompetenceProgress = InferInsertModel<typeof studentCompetenceProgress>;
export type LearningSessionTracking = InferSelectModel<typeof learningSessionTracking>;
export type NewLearningSessionTracking = InferInsertModel<typeof learningSessionTracking>;
export type ExercisePerformanceAnalytics = InferSelectModel<typeof exercisePerformanceAnalytics>;
export type NewExercisePerformanceAnalytics = InferInsertModel<typeof exercisePerformanceAnalytics>;
export type StudentAchievements = InferSelectModel<typeof studentAchievements>;
export type NewStudentAchievements = InferInsertModel<typeof studentAchievements>;

// Leaderboard type exports
export type Leaderboard = InferSelectModel<typeof leaderboards>;
export type NewLeaderboard = InferInsertModel<typeof leaderboards>;
export type LeaderboardHistory = InferSelectModel<typeof leaderboardHistory>;
export type NewLeaderboardHistory = InferInsertModel<typeof leaderboardHistory>;
export type StudentBadge = InferSelectModel<typeof studentBadges>;
export type NewStudentBadge = InferInsertModel<typeof studentBadges>;
export type Competition = InferSelectModel<typeof competitions>;
export type NewCompetition = InferInsertModel<typeof competitions>;
export type CompetitionParticipant = InferSelectModel<typeof competitionParticipants>;
export type NewCompetitionParticipant = InferInsertModel<typeof competitionParticipants>;

// Parent system type exports
export type Parent = InferSelectModel<typeof parents>;
export type NewParent = InferInsertModel<typeof parents>;
export type ParentStudentRelation = InferSelectModel<typeof parentStudentRelations>;
export type NewParentStudentRelation = InferInsertModel<typeof parentStudentRelations>;
export type ParentalConsent = InferSelectModel<typeof parentalConsent>;
export type NewParentalConsent = InferInsertModel<typeof parentalConsent>;

// GDPR type exports  
export type GdprConsentRequest = InferSelectModel<typeof gdprConsentRequests>;
export type NewGdprConsentRequest = InferInsertModel<typeof gdprConsentRequests>;


