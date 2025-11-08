"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competences = exports.fileVariants = exports.files = exports.complianceReports = exports.securityAlerts = exports.MasteryLevels = exports.encryptionKeys = exports.parentalConsent = exports.parentStudentRelations = exports.parents = exports.consentPreferences = exports.retentionSchedules = exports.retentionPolicies = exports.gdprRequests = exports.competencePrerequisites = exports.competitionParticipants = exports.competitions = exports.studentBadges = exports.leaderboardHistory = exports.leaderboards = exports.studentAchievements = exports.exercisePerformanceAnalytics = exports.learningSessionTracking = exports.studentCompetenceProgress = exports.weeklyProgressSummary = exports.dailyLearningAnalytics = exports.pushNotifications = exports.spacedRepetition = exports.dailyGoals = exports.streakFreezes = exports.streaks = exports.gdprDataProcessingLog = exports.gdprFiles = exports.auditLogs = exports.gdprConsentRequests = exports.studentProgressRelations = exports.exercisesRelations = exports.studentsRelations = exports.modules = exports.revisions = exports.sessions = exports.studentLearningPath = exports.studentProgress = exports.exercises = exports.students = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// =============================================================================
// CORE TABLES
// =============================================================================
// Students table
exports.students = (0, mysql_core_1.mysqlTable)('students', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    prenom: (0, mysql_core_1.varchar)('prenom', { length: 100 }).notNull(),
    nom: (0, mysql_core_1.varchar)('nom', { length: 100 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).unique(),
    passwordHash: (0, mysql_core_1.varchar)('password_hash', { length: 255 }),
    dateNaissance: (0, mysql_core_1.date)('date_naissance').notNull(),
    niveauActuel: (0, mysql_core_1.varchar)('niveau_actuel', { length: 20 }).notNull(),
    totalPoints: (0, mysql_core_1.int)('total_points').default(0),
    xp: (0, mysql_core_1.int)('xp').default(0),
    serieJours: (0, mysql_core_1.int)('serie_jours').default(0),
    mascotteType: (0, mysql_core_1.varchar)('mascotte_type', { length: 50 }).default('dragon'),
    dernierAcces: (0, mysql_core_1.timestamp)('dernier_acces'),
    estConnecte: (0, mysql_core_1.boolean)('est_connecte').default(false),
    failedLoginAttempts: (0, mysql_core_1.int)('failed_login_attempts').default(0),
    lockedUntil: (0, mysql_core_1.timestamp)('locked_until'),
    passwordResetToken: (0, mysql_core_1.varchar)('password_reset_token', { length: 255 }),
    passwordResetExpires: (0, mysql_core_1.timestamp)('password_reset_expires'),
    niveauScolaire: (0, mysql_core_1.varchar)('niveau_scolaire', { length: 20 }).notNull(),
    mascotteColor: (0, mysql_core_1.varchar)('mascotte_color', { length: 20 }).default('#ff6b35'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Exercises table
exports.exercises = (0, mysql_core_1.mysqlTable)('exercises', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    titre: (0, mysql_core_1.varchar)('titre', { length: 200 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    matiere: (0, mysql_core_1.varchar)('matiere', { length: 50 }).notNull(),
    niveau: (0, mysql_core_1.varchar)('niveau', { length: 20 }).notNull(),
    difficulte: (0, mysql_core_1.varchar)('difficulte', { length: 30 }).notNull(),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    prerequis: (0, mysql_core_1.json)('prerequis'),
    contenu: (0, mysql_core_1.json)('contenu').notNull(),
    solution: (0, mysql_core_1.json)('solution').notNull(),
    pointsRecompense: (0, mysql_core_1.int)('points_recompense').default(10),
    tempsEstime: (0, mysql_core_1.int)('temps_estime').default(300),
    typeExercice: (0, mysql_core_1.varchar)('type_exercice', { length: 30 }).notNull(),
    xp: (0, mysql_core_1.int)('xp').default(10),
    configuration: (0, mysql_core_1.json)('configuration'),
    ordre: (0, mysql_core_1.int)('ordre').default(0),
    estActif: (0, mysql_core_1.boolean)('est_actif').default(true),
    metadonnees: (0, mysql_core_1.json)('metadonnees'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Student Progress table
exports.studentProgress = (0, mysql_core_1.mysqlTable)('student_progress', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    exerciseId: (0, mysql_core_1.int)('exercise_id').notNull().references(() => exports.exercises.id),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    progressPercent: (0, mysql_core_1.decimal)('progress_percent', { precision: 5, scale: 2 }).default('0.00'),
    masteryLevel: (0, mysql_core_1.varchar)('mastery_level', { length: 20 }).notNull().default('not_started'),
    totalAttempts: (0, mysql_core_1.int)('total_attempts').default(0),
    successfulAttempts: (0, mysql_core_1.int)('successful_attempts').default(0),
    averageScore: (0, mysql_core_1.decimal)('average_score', { precision: 5, scale: 2 }).default('0.00'),
    bestScore: (0, mysql_core_1.decimal)('best_score', { precision: 5, scale: 2 }).default('0.00'),
    totalTimeSpent: (0, mysql_core_1.int)('total_time_spent').default(0),
    timeSpent: (0, mysql_core_1.int)('time_spent').default(0),
    lastAttemptAt: (0, mysql_core_1.timestamp)('last_attempt_at'),
    masteredAt: (0, mysql_core_1.timestamp)('mastered_at'),
    needsReview: (0, mysql_core_1.boolean)('needs_review').default(false),
    reviewScheduledAt: (0, mysql_core_1.timestamp)('review_scheduled_at'),
    streakCount: (0, mysql_core_1.int)('streak_count').default(0),
    difficultyPreference: (0, mysql_core_1.varchar)('difficulty_preference', { length: 30 }),
    completed: (0, mysql_core_1.boolean)('completed').default(false),
    completedAt: (0, mysql_core_1.timestamp)('completed_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Student Learning Path table
exports.studentLearningPath = (0, mysql_core_1.mysqlTable)('student_learning_path', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    currentLevel: (0, mysql_core_1.varchar)('current_level', { length: 20 }).notNull().default('decouverte'),
    targetLevel: (0, mysql_core_1.varchar)('target_level', { length: 20 }).notNull().default('maitrise'),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).notNull().default('available'),
    priority: (0, mysql_core_1.varchar)('priority', { length: 20 }).notNull().default('normal'),
    recommendedDifficulty: (0, mysql_core_1.varchar)('recommended_difficulty', { length: 30 }).notNull().default('decouverte'),
    estimatedCompletionTime: (0, mysql_core_1.int)('estimated_completion_time'),
    personalizedOrder: (0, mysql_core_1.int)('personalized_order').default(0),
    isBlocked: (0, mysql_core_1.boolean)('is_blocked').default(false),
    blockingReasons: (0, mysql_core_1.json)('blocking_reasons'),
    unlockedAt: (0, mysql_core_1.timestamp)('unlocked_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Sessions table
exports.sessions = (0, mysql_core_1.mysqlTable)('sessions', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    expiresAt: (0, mysql_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Revisions table
exports.revisions = (0, mysql_core_1.mysqlTable)('revisions', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    exerciseId: (0, mysql_core_1.int)('exercise_id').references(() => exports.exercises.id),
    revisionDate: (0, mysql_core_1.date)('revision_date').notNull(),
    score: (0, mysql_core_1.int)('score').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Modules table
exports.modules = (0, mysql_core_1.mysqlTable)('modules', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    titre: (0, mysql_core_1.varchar)('titre', { length: 200 }).notNull(),
    matiere: (0, mysql_core_1.varchar)('matiere', { length: 50 }).notNull(),
    niveau: (0, mysql_core_1.varchar)('niveau', { length: 20 }).notNull(),
    ordre: (0, mysql_core_1.int)('ordre').default(0),
    estActif: (0, mysql_core_1.boolean)('est_actif').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.studentsRelations = (0, drizzle_orm_1.relations)(exports.students, ({ many }) => ({
    progress: many(exports.studentProgress),
    sessions: many(exports.sessions),
    revisions: many(exports.revisions),
    learningPath: many(exports.studentLearningPath)
}));
exports.exercisesRelations = (0, drizzle_orm_1.relations)(exports.exercises, ({ many }) => ({
    progress: many(exports.studentProgress),
    revisions: many(exports.revisions)
}));
exports.studentProgressRelations = (0, drizzle_orm_1.relations)(exports.studentProgress, ({ one }) => ({
    student: one(exports.students, {
        fields: [exports.studentProgress.studentId],
        references: [exports.students.id]
    }),
    exercise: one(exports.exercises, {
        fields: [exports.studentProgress.exerciseId],
        references: [exports.exercises.id]
    })
}));
// =============================================================================
// GDPR & COMPLIANCE TABLES
// =============================================================================
// GDPR Consent Requests table
exports.gdprConsentRequests = (0, mysql_core_1.mysqlTable)('gdpr_consent_requests', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    consentType: (0, mysql_core_1.varchar)('consent_type', { length: 50 }).notNull(),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).default('pending'),
    requestToken: (0, mysql_core_1.varchar)('request_token', { length: 255 }),
    requestType: (0, mysql_core_1.varchar)('request_type', { length: 50 }),
    expiresAt: (0, mysql_core_1.timestamp)('expires_at'),
    processedAt: (0, mysql_core_1.timestamp)('processed_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Audit Logs table
exports.auditLogs = (0, mysql_core_1.mysqlTable)('audit_logs', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(), // UUID
    entityType: (0, mysql_core_1.varchar)('entity_type', { length: 50 }).notNull(),
    entityId: (0, mysql_core_1.varchar)('entity_id', { length: 100 }).notNull(),
    action: (0, mysql_core_1.varchar)('action', { length: 50 }).notNull(),
    userId: (0, mysql_core_1.varchar)('user_id', { length: 36 }),
    parentId: (0, mysql_core_1.varchar)('parent_id', { length: 36 }),
    studentId: (0, mysql_core_1.varchar)('student_id', { length: 36 }),
    details: (0, mysql_core_1.json)('details').notNull(),
    ipAddress: (0, mysql_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, mysql_core_1.text)('user_agent'),
    timestamp: (0, mysql_core_1.timestamp)('timestamp').notNull().defaultNow(),
    severity: (0, mysql_core_1.varchar)('severity', { length: 20 }).notNull().default('medium'),
    category: (0, mysql_core_1.varchar)('category', { length: 50 }),
    sessionId: (0, mysql_core_1.varchar)('session_id', { length: 100 }),
    correlationId: (0, mysql_core_1.varchar)('correlation_id', { length: 36 }),
    checksum: (0, mysql_core_1.varchar)('checksum', { length: 64 }).notNull(),
    encrypted: (0, mysql_core_1.boolean)('encrypted').default(false),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// GDPR Files table
exports.gdprFiles = (0, mysql_core_1.mysqlTable)('gdpr_files', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    fileName: (0, mysql_core_1.varchar)('file_name', { length: 255 }).notNull(),
    filePath: (0, mysql_core_1.varchar)('file_path', { length: 500 }).notNull(),
    fileSize: (0, mysql_core_1.int)('file_size').notNull(),
    mimeType: (0, mysql_core_1.varchar)('mime_type', { length: 100 }).notNull(),
    fileHash: (0, mysql_core_1.varchar)('file_hash', { length: 64 }),
    encrypted: (0, mysql_core_1.boolean)('encrypted').default(false),
    retentionDate: (0, mysql_core_1.timestamp)('retention_date'),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).default('active'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// GDPR Data Processing Log table  
exports.gdprDataProcessingLog = (0, mysql_core_1.mysqlTable)('gdpr_data_processing_log', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    action: (0, mysql_core_1.varchar)('action', { length: 100 }).notNull(),
    dataType: (0, mysql_core_1.varchar)('data_type', { length: 50 }),
    details: (0, mysql_core_1.text)('details'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// =============================================================================
// STREAK PSYCHOLOGY & GAMIFICATION TABLES
// =============================================================================
// Student Streaks table
exports.streaks = (0, mysql_core_1.mysqlTable)('streaks', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    currentStreak: (0, mysql_core_1.int)('current_streak').default(0),
    longestStreak: (0, mysql_core_1.int)('longest_streak').default(0),
    lastActivityDate: (0, mysql_core_1.timestamp)('last_activity_date').notNull().defaultNow(),
    streakFreezes: (0, mysql_core_1.int)('streak_freezes').default(0),
    weeklyGoal: (0, mysql_core_1.int)('weekly_goal').default(5), // days per week
    streakSafeUntil: (0, mysql_core_1.timestamp)('streak_safe_until'),
    emotionalState: (0, mysql_core_1.varchar)('emotional_state', { length: 20 }).default('cold'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Streak Freezes Usage Log table
exports.streakFreezes = (0, mysql_core_1.mysqlTable)('streak_freezes', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    usedAt: (0, mysql_core_1.timestamp)('used_at').notNull().defaultNow(),
    protectedStreak: (0, mysql_core_1.int)('protected_streak').notNull(),
    reason: (0, mysql_core_1.varchar)('reason', { length: 50 }).default('manual_use'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Daily Goals table
exports.dailyGoals = (0, mysql_core_1.mysqlTable)('daily_goals', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    goalDate: (0, mysql_core_1.date)('goal_date').notNull(),
    targetExercises: (0, mysql_core_1.int)('target_exercises').default(3),
    completedExercises: (0, mysql_core_1.int)('completed_exercises').default(0),
    goalMet: (0, mysql_core_1.boolean)('goal_met').default(false),
    studyTimeMinutes: (0, mysql_core_1.int)('study_time_minutes').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Spaced Repetition table
exports.spacedRepetition = (0, mysql_core_1.mysqlTable)('spaced_repetition', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    exerciseId: (0, mysql_core_1.int)('exercise_id').notNull().references(() => exports.exercises.id),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    // SuperMemo-2 Algorithm parameters
    easinessFactor: (0, mysql_core_1.decimal)('easiness_factor', { precision: 3, scale: 2 }).default('2.5'),
    repetitionNumber: (0, mysql_core_1.int)('repetition_number').default(0),
    intervalDays: (0, mysql_core_1.int)('interval_days').default(1),
    // Scheduling
    nextReviewDate: (0, mysql_core_1.timestamp)('next_review_date').notNull(),
    lastReviewDate: (0, mysql_core_1.timestamp)('last_review_date'),
    // Performance tracking
    correctAnswers: (0, mysql_core_1.int)('correct_answers').default(0),
    totalReviews: (0, mysql_core_1.int)('total_reviews').default(0),
    averageResponseTime: (0, mysql_core_1.int)('average_response_time').default(0),
    // Status
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    priority: (0, mysql_core_1.varchar)('priority', { length: 20 }).default('normal'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Push Notifications table
exports.pushNotifications = (0, mysql_core_1.mysqlTable)('push_notifications', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    deviceToken: (0, mysql_core_1.varchar)('device_token', { length: 255 }).notNull(),
    platform: (0, mysql_core_1.varchar)('platform', { length: 20 }).notNull(), // 'ios', 'android', 'web'
    // Notification preferences
    streakReminders: (0, mysql_core_1.boolean)('streak_reminders').default(true),
    dailyGoalReminders: (0, mysql_core_1.boolean)('daily_goal_reminders').default(true),
    spacedRepetitionReminders: (0, mysql_core_1.boolean)('spaced_repetition_reminders').default(true),
    achievementNotifications: (0, mysql_core_1.boolean)('achievement_notifications').default(true),
    // Timing preferences
    reminderTime: (0, mysql_core_1.varchar)('reminder_time', { length: 8 }).default('19:00'), // HH:MM format
    timeZone: (0, mysql_core_1.varchar)('time_zone', { length: 50 }).default('Europe/Paris'),
    // Quiet hours
    quietHoursStart: (0, mysql_core_1.varchar)('quiet_hours_start', { length: 8 }).default('22:00'),
    quietHoursEnd: (0, mysql_core_1.varchar)('quiet_hours_end', { length: 8 }).default('08:00'),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Analytics tables
exports.dailyLearningAnalytics = (0, mysql_core_1.mysqlTable)('daily_learning_analytics', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    date: (0, mysql_core_1.date)('date').notNull(),
    exercisesCompleted: (0, mysql_core_1.int)('exercises_completed').default(0),
    timeSpent: (0, mysql_core_1.int)('time_spent').default(0),
    totalTimeMinutes: (0, mysql_core_1.int)('total_time_minutes').default(0),
    totalExercises: (0, mysql_core_1.int)('total_exercises').default(0),
    completedExercises: (0, mysql_core_1.int)('completed_exercises').default(0),
    avgScore: (0, mysql_core_1.decimal)('avg_score', { precision: 5, scale: 2 }).default('0.00'),
    averageScore: (0, mysql_core_1.decimal)('average_score', { precision: 5, scale: 2 }).default('0.00'),
    competencesWorked: (0, mysql_core_1.int)('competences_worked').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.weeklyProgressSummary = (0, mysql_core_1.mysqlTable)('weekly_progress_summary', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    weekStart: (0, mysql_core_1.date)('week_start').notNull(),
    totalExercises: (0, mysql_core_1.int)('total_exercises').default(0),
    completedExercises: (0, mysql_core_1.int)('completed_exercises').default(0),
    totalTimeSpent: (0, mysql_core_1.int)('total_time_spent').default(0),
    avgScore: (0, mysql_core_1.decimal)('avg_score', { precision: 5, scale: 2 }).default('0.00'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.studentCompetenceProgress = (0, mysql_core_1.mysqlTable)('student_competence_progress', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    progressPercent: (0, mysql_core_1.decimal)('progress_percent', { precision: 5, scale: 2 }).default('0.00'),
    masteryLevel: (0, mysql_core_1.varchar)('mastery_level', { length: 20 }).default('not_started'),
    currentScore: (0, mysql_core_1.decimal)('current_score', { precision: 5, scale: 2 }).default('0.00'),
    totalAttempts: (0, mysql_core_1.int)('total_attempts').default(0),
    successfulAttempts: (0, mysql_core_1.int)('successful_attempts').default(0),
    lastAttemptAt: (0, mysql_core_1.timestamp)('last_attempt_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
exports.learningSessionTracking = (0, mysql_core_1.mysqlTable)('learning_session_tracking', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    sessionStart: (0, mysql_core_1.timestamp)('session_start').notNull(),
    sessionEnd: (0, mysql_core_1.timestamp)('session_end'),
    exercisesCompleted: (0, mysql_core_1.int)('exercises_completed').default(0),
    averageScore: (0, mysql_core_1.decimal)('average_score', { precision: 5, scale: 2 }).default('0.00'),
    focusTime: (0, mysql_core_1.int)('focus_time').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.exercisePerformanceAnalytics = (0, mysql_core_1.mysqlTable)('exercise_performance_analytics', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    exerciseId: (0, mysql_core_1.int)('exercise_id').notNull().references(() => exports.exercises.id),
    totalAttempts: (0, mysql_core_1.int)('total_attempts').default(0),
    successfulAttempts: (0, mysql_core_1.int)('successful_attempts').default(0),
    avgCompletionTime: (0, mysql_core_1.int)('avg_completion_time').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.studentAchievements = (0, mysql_core_1.mysqlTable)('student_achievements', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    achievementCode: (0, mysql_core_1.varchar)('achievement_code', { length: 50 }).notNull(),
    badgeIcon: (0, mysql_core_1.varchar)('badge_icon', { length: 255 }),
    achievementType: (0, mysql_core_1.varchar)('achievement_type', { length: 50 }).notNull(),
    title: (0, mysql_core_1.varchar)('title', { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    xpReward: (0, mysql_core_1.int)('xp_reward').default(10),
    unlockedAt: (0, mysql_core_1.timestamp)('unlocked_at').notNull().defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Leaderboard Tables
exports.leaderboards = (0, mysql_core_1.mysqlTable)('leaderboards', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    type: (0, mysql_core_1.varchar)('type', { length: 50 }).notNull(),
    category: (0, mysql_core_1.varchar)('category', { length: 50 }).notNull(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    score: (0, mysql_core_1.int)('score').notNull(),
    rank: (0, mysql_core_1.int)('rank').notNull(),
    previousRank: (0, mysql_core_1.int)('previous_rank'),
    rankChange: (0, mysql_core_1.int)('rank_change').default(0),
    period: (0, mysql_core_1.varchar)('period', { length: 20 }),
    classId: (0, mysql_core_1.int)('class_id'),
    metadata: (0, mysql_core_1.json)('metadata'),
    lastUpdated: (0, mysql_core_1.timestamp)('last_updated').notNull().defaultNow().onUpdateNow(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.leaderboardHistory = (0, mysql_core_1.mysqlTable)('leaderboard_history', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    leaderboardType: (0, mysql_core_1.varchar)('leaderboard_type', { length: 50 }).notNull(),
    rank: (0, mysql_core_1.int)('rank').notNull(),
    score: (0, mysql_core_1.int)('score').notNull(),
    period: (0, mysql_core_1.varchar)('period', { length: 20 }).notNull(),
    recordedAt: (0, mysql_core_1.timestamp)('recorded_at').notNull().defaultNow()
});
exports.studentBadges = (0, mysql_core_1.mysqlTable)('student_badges', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    badgeType: (0, mysql_core_1.varchar)('badge_type', { length: 50 }).notNull(),
    title: (0, mysql_core_1.varchar)('title', { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    icon: (0, mysql_core_1.varchar)('icon', { length: 255 }),
    rarity: (0, mysql_core_1.varchar)('rarity', { length: 20 }).default('common'),
    earnedAt: (0, mysql_core_1.timestamp)('earned_at').notNull().defaultNow(),
    validUntil: (0, mysql_core_1.timestamp)('valid_until'),
    metadata: (0, mysql_core_1.json)('metadata')
});
exports.competitions = (0, mysql_core_1.mysqlTable)('competitions', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    name: (0, mysql_core_1.varchar)('name', { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    type: (0, mysql_core_1.varchar)('type', { length: 50 }).notNull(),
    startDate: (0, mysql_core_1.timestamp)('start_date').notNull(),
    endDate: (0, mysql_core_1.timestamp)('end_date').notNull(),
    rules: (0, mysql_core_1.json)('rules'),
    rewards: (0, mysql_core_1.json)('rewards'),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    participants: (0, mysql_core_1.int)('participants').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.competitionParticipants = (0, mysql_core_1.mysqlTable)('competition_participants', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    competitionId: (0, mysql_core_1.int)('competition_id').notNull().references(() => exports.competitions.id),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    score: (0, mysql_core_1.int)('score').default(0),
    rank: (0, mysql_core_1.int)('rank'),
    progress: (0, mysql_core_1.json)('progress'),
    joinedAt: (0, mysql_core_1.timestamp)('joined_at').notNull().defaultNow(),
    lastActivity: (0, mysql_core_1.timestamp)('last_activity').notNull().defaultNow().onUpdateNow()
});
// Competence prerequisites table
exports.competencePrerequisites = (0, mysql_core_1.mysqlTable)('competence_prerequisites', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    competenceCode: (0, mysql_core_1.varchar)('competence_code', { length: 20 }).notNull(),
    prerequisiteCode: (0, mysql_core_1.varchar)('prerequisite_code', { length: 20 }).notNull(),
    required: (0, mysql_core_1.boolean)('required').default(true),
    minimumLevel: (0, mysql_core_1.varchar)('minimum_level', { length: 20 }).default('decouverte'),
    description: (0, mysql_core_1.text)('description'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// GDPR type exports  
exports.gdprRequests = (0, mysql_core_1.mysqlTable)('gdpr_requests', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    requestType: (0, mysql_core_1.varchar)('request_type', { length: 50 }).notNull(),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).default('pending'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.retentionPolicies = (0, mysql_core_1.mysqlTable)('retention_policies', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    policyName: (0, mysql_core_1.varchar)('policy_name', { length: 100 }).notNull(),
    entityType: (0, mysql_core_1.varchar)('entity_type', { length: 50 }).notNull(),
    retentionPeriodDays: (0, mysql_core_1.int)('retention_period_days').notNull(),
    active: (0, mysql_core_1.boolean)('active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
exports.retentionSchedules = (0, mysql_core_1.mysqlTable)('retention_schedules', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    entityType: (0, mysql_core_1.varchar)('entity_type', { length: 50 }).notNull(),
    entityId: (0, mysql_core_1.varchar)('entity_id', { length: 36 }).notNull(),
    scheduledDate: (0, mysql_core_1.timestamp)('scheduled_date').notNull(),
    action: (0, mysql_core_1.varchar)('action', { length: 50 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.consentPreferences = (0, mysql_core_1.mysqlTable)('consent_preferences', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    consentType: (0, mysql_core_1.varchar)('consent_type', { length: 50 }).notNull(),
    granted: (0, mysql_core_1.boolean)('granted').default(false),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Parents table
exports.parents = (0, mysql_core_1.mysqlTable)('parents', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    nom: (0, mysql_core_1.varchar)('nom', { length: 100 }).notNull(),
    prenom: (0, mysql_core_1.varchar)('prenom', { length: 100 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).unique().notNull(),
    passwordHash: (0, mysql_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    telephone: (0, mysql_core_1.varchar)('telephone', { length: 20 }),
    dateNaissance: (0, mysql_core_1.date)('date_naissance'),
    profession: (0, mysql_core_1.varchar)('profession', { length: 100 }),
    // Account settings
    emailVerified: (0, mysql_core_1.boolean)('email_verified').default(false),
    emailVerificationToken: (0, mysql_core_1.varchar)('email_verification_token', { length: 255 }),
    passwordResetToken: (0, mysql_core_1.varchar)('password_reset_token', { length: 255 }),
    passwordResetExpires: (0, mysql_core_1.timestamp)('password_reset_expires'),
    // Security
    failedLoginAttempts: (0, mysql_core_1.int)('failed_login_attempts').default(0),
    lockedUntil: (0, mysql_core_1.timestamp)('locked_until'),
    lastLogin: (0, mysql_core_1.timestamp)('last_login'),
    // Notifications preferences
    dailyReportEnabled: (0, mysql_core_1.boolean)('daily_report_enabled').default(true),
    weeklyReportEnabled: (0, mysql_core_1.boolean)('weekly_report_enabled').default(true),
    achievementNotificationsEnabled: (0, mysql_core_1.boolean)('achievement_notifications_enabled').default(true),
    progressAlertsEnabled: (0, mysql_core_1.boolean)('progress_alerts_enabled').default(true),
    // Communication preferences  
    preferredLanguage: (0, mysql_core_1.varchar)('preferred_language', { length: 10 }).default('fr'),
    timeZone: (0, mysql_core_1.varchar)('time_zone', { length: 50 }).default('Europe/Paris'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
// Parent-Student relationships
exports.parentStudentRelations = (0, mysql_core_1.mysqlTable)('parent_student_relations', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    parentId: (0, mysql_core_1.int)('parent_id').notNull().references(() => exports.parents.id),
    studentId: (0, mysql_core_1.int)('student_id').notNull().references(() => exports.students.id),
    relationshipType: (0, mysql_core_1.varchar)('relationship_type', { length: 50 }).notNull().default('parent'), // parent, guardian, tutor
    isPrimaryContact: (0, mysql_core_1.boolean)('is_primary_contact').default(false),
    canViewProgress: (0, mysql_core_1.boolean)('can_view_progress').default(true),
    canManageAccount: (0, mysql_core_1.boolean)('can_manage_account').default(true),
    canReceiveReports: (0, mysql_core_1.boolean)('can_receive_reports').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
exports.parentalConsent = (0, mysql_core_1.mysqlTable)('parental_consent', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    parentId: (0, mysql_core_1.int)('parent_id').references(() => exports.parents.id),
    parentName: (0, mysql_core_1.varchar)('parent_name', { length: 200 }).notNull(),
    parentEmail: (0, mysql_core_1.varchar)('parent_email', { length: 255 }).notNull(),
    consentGiven: (0, mysql_core_1.boolean)('consent_given').default(false),
    consentDate: (0, mysql_core_1.timestamp)('consent_date'),
    consentType: (0, mysql_core_1.varchar)('consent_type', { length: 50 }).notNull().default('general'),
    ipAddress: (0, mysql_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, mysql_core_1.text)('user_agent'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.encryptionKeys = (0, mysql_core_1.mysqlTable)('encryption_keys', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    keyType: (0, mysql_core_1.varchar)('key_type', { length: 50 }).notNull(),
    encryptedKey: (0, mysql_core_1.text)('encrypted_key').notNull(),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Add MasteryLevels export
exports.MasteryLevels = {
    NOT_STARTED: 'not_started',
    DECOUVERTE: 'decouverte',
    EN_COURS: 'en_cours',
    MAITRISE: 'maitrise',
    EXPERT: 'expert'
};
exports.securityAlerts = (0, mysql_core_1.mysqlTable)('security_alerts', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    type: (0, mysql_core_1.varchar)('type', { length: 50 }).notNull(),
    alertType: (0, mysql_core_1.varchar)('alert_type', { length: 50 }).notNull(),
    severity: (0, mysql_core_1.varchar)('severity', { length: 20 }).notNull(),
    entityType: (0, mysql_core_1.varchar)('entity_type', { length: 50 }).notNull(),
    entityId: (0, mysql_core_1.varchar)('entity_id', { length: 50 }).notNull(),
    message: (0, mysql_core_1.text)('message').notNull(),
    description: (0, mysql_core_1.text)('description'),
    isResolved: (0, mysql_core_1.boolean)('is_resolved').default(false),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
exports.complianceReports = (0, mysql_core_1.mysqlTable)('compliance_reports', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    reportType: (0, mysql_core_1.varchar)('report_type', { length: 50 }).notNull(),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).notNull(),
    data: (0, mysql_core_1.json)('data'),
    generatedAt: (0, mysql_core_1.timestamp)('generated_at').notNull().defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.files = (0, mysql_core_1.mysqlTable)('files', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').references(() => exports.students.id),
    fileName: (0, mysql_core_1.varchar)('file_name', { length: 255 }).notNull(),
    filePath: (0, mysql_core_1.varchar)('file_path', { length: 500 }).notNull(),
    fileSize: (0, mysql_core_1.int)('file_size').notNull(),
    mimeType: (0, mysql_core_1.varchar)('mime_type', { length: 100 }).notNull(),
    uploadedAt: (0, mysql_core_1.timestamp)('uploaded_at').notNull().defaultNow(),
    uploadedBy: (0, mysql_core_1.varchar)('uploaded_by', { length: 100 }),
    status: (0, mysql_core_1.varchar)('status', { length: 20 }).default('active'),
    category: (0, mysql_core_1.varchar)('category', { length: 50 }).default('general'),
    isPublic: (0, mysql_core_1.boolean)('is_public').default(false),
    checksum: (0, mysql_core_1.varchar)('checksum', { length: 64 }),
    url: (0, mysql_core_1.varchar)('url', { length: 500 }),
    thumbnailUrl: (0, mysql_core_1.varchar)('thumbnail_url', { length: 500 }),
    metadata: (0, mysql_core_1.json)('metadata'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
exports.fileVariants = (0, mysql_core_1.mysqlTable)('file_variants', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey(),
    originalFileId: (0, mysql_core_1.varchar)('original_file_id', { length: 36 }).notNull().references(() => exports.files.id),
    variantType: (0, mysql_core_1.varchar)('variant_type', { length: 50 }).notNull(),
    filePath: (0, mysql_core_1.varchar)('file_path', { length: 500 }).notNull(),
    fileSize: (0, mysql_core_1.int)('file_size').notNull(),
    url: (0, mysql_core_1.varchar)('url', { length: 500 }),
    metadata: (0, mysql_core_1.json)('metadata'),
    deletedAt: (0, mysql_core_1.timestamp)('deleted_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Competences table (CP2025)
exports.competences = (0, mysql_core_1.mysqlTable)('competences', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    code: (0, mysql_core_1.varchar)('code', { length: 20 }).notNull().unique(),
    titre: (0, mysql_core_1.varchar)('titre', { length: 200 }).notNull(),
    matiere: (0, mysql_core_1.varchar)('matiere', { length: 50 }).notNull(),
    domaine: (0, mysql_core_1.varchar)('domaine', { length: 50 }),
    description: (0, mysql_core_1.text)('description'),
    niveau: (0, mysql_core_1.varchar)('niveau', { length: 20 }),
    est_actif: (0, mysql_core_1.boolean)('est_actif').default(true),
    xp_reward: (0, mysql_core_1.int)('xp_reward').default(10),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').notNull().defaultNow().onUpdateNow()
});
