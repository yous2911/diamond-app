"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentProgressRelations = exports.exercisesRelations = exports.studentsRelations = exports.modules = exports.revisions = exports.sessions = exports.studentLearningPath = exports.studentProgress = exports.exercises = exports.students = void 0;
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
    lastAttemptAt: (0, mysql_core_1.timestamp)('last_attempt_at'),
    masteredAt: (0, mysql_core_1.timestamp)('mastered_at'),
    needsReview: (0, mysql_core_1.boolean)('needs_review').default(false),
    reviewScheduledAt: (0, mysql_core_1.timestamp)('review_scheduled_at'),
    streakCount: (0, mysql_core_1.int)('streak_count').default(0),
    difficultyPreference: (0, mysql_core_1.varchar)('difficulty_preference', { length: 30 }),
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
