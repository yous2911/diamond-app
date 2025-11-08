"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentStats = exports.studentAchievements = exports.achievements = exports.studentWardrobe = exports.wardrobeItems = exports.mascots = exports.exerciseResults = exports.learningSessions = exports.studentProgress = exports.exercises = exports.competencesCp = exports.students = void 0;
// MySQL Schema for CP 2025 curriculum - Compatible with the SQL schema
const mysql_core_1 = require("drizzle-orm/mysql-core");
// =============================================================================
// TABLE DES ÉLÈVES (Students)
// =============================================================================
exports.students = (0, mysql_core_1.mysqlTable)('students', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    prenom: (0, mysql_core_1.varchar)('prenom', { length: 50 }).notNull(),
    nom: (0, mysql_core_1.varchar)('nom', { length: 50 }).notNull(),
    identifiant: (0, mysql_core_1.varchar)('identifiant', { length: 20 }).notNull().unique(),
    motDePasse: (0, mysql_core_1.varchar)('mot_de_passe', { length: 255 }).notNull(),
    classe: (0, mysql_core_1.varchar)('classe', { length: 10 }).notNull().default('CP'),
    niveau: (0, mysql_core_1.varchar)('niveau', { length: 10 }).notNull().default('CP'),
    ageGroup: (0, mysql_core_1.mysqlEnum)('age_group', ['6-8', '9-11']).notNull().default('6-8'),
    dateInscription: (0, mysql_core_1.datetime)('date_inscription').default(new Date()),
    lastLogin: (0, mysql_core_1.datetime)('last_login'),
    totalXp: (0, mysql_core_1.int)('total_xp').default(0),
    currentLevel: (0, mysql_core_1.int)('current_level').default(1),
    currentStreak: (0, mysql_core_1.int)('current_streak').default(0),
    heartsRemaining: (0, mysql_core_1.int)('hearts_remaining').default(3),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
});
// =============================================================================
// TABLE DES COMPÉTENCES CP 2025
// =============================================================================
exports.competencesCp = (0, mysql_core_1.mysqlTable)('competences_cp', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    code: (0, mysql_core_1.varchar)('code', { length: 20 }).notNull().unique(),
    nom: (0, mysql_core_1.varchar)('nom', { length: 200 }).notNull(),
    matiere: (0, mysql_core_1.mysqlEnum)('matiere', ['FR', 'MA']).notNull(),
    domaine: (0, mysql_core_1.varchar)('domaine', { length: 10 }).notNull(),
    niveauComp: (0, mysql_core_1.int)('niveau_comp').notNull(),
    sousCompetence: (0, mysql_core_1.int)('sous_competence').notNull(),
    description: (0, mysql_core_1.text)('description'),
    seuilMaitrise: (0, mysql_core_1.decimal)('seuil_maitrise', { precision: 3, scale: 2 }).default('0.80'),
    xpReward: (0, mysql_core_1.int)('xp_reward').default(10),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
});
// =============================================================================
// TABLE DES EXERCICES
// =============================================================================
exports.exercises = (0, mysql_core_1.mysqlTable)('exercises', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    competenceId: (0, mysql_core_1.int)('competence_id').notNull(),
    type: (0, mysql_core_1.mysqlEnum)('type', ['CALCUL', 'MENTAL_MATH', 'DRAG_DROP', 'QCM', 'LECTURE', 'ECRITURE', 'COMPREHENSION']).notNull(),
    question: (0, mysql_core_1.text)('question').notNull(),
    correctAnswer: (0, mysql_core_1.text)('correct_answer').notNull(),
    options: (0, mysql_core_1.json)('options'),
    difficultyLevel: (0, mysql_core_1.int)('difficulty_level').notNull().default(3),
    xpReward: (0, mysql_core_1.int)('xp_reward').default(5),
    timeLimit: (0, mysql_core_1.int)('time_limit').default(60),
    hintsAvailable: (0, mysql_core_1.int)('hints_available').default(0),
    hintsText: (0, mysql_core_1.json)('hints_text'),
    metadata: (0, mysql_core_1.json)('metadata'),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
});
// =============================================================================
// TABLE DES PROGRÈS DES ÉLÈVES
// =============================================================================
exports.studentProgress = (0, mysql_core_1.mysqlTable)('student_progress', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull(),
    competenceId: (0, mysql_core_1.int)('competence_id').notNull(),
    status: (0, mysql_core_1.mysqlEnum)('status', ['not_started', 'learning', 'mastered', 'failed']).default('not_started'),
    currentLevel: (0, mysql_core_1.int)('current_level').default(0),
    successRate: (0, mysql_core_1.decimal)('success_rate', { precision: 3, scale: 2 }).default('0.00'),
    attemptsCount: (0, mysql_core_1.int)('attempts_count').default(0),
    correctAttempts: (0, mysql_core_1.int)('correct_attempts').default(0),
    lastPracticeDate: (0, mysql_core_1.datetime)('last_practice_date'),
    nextReviewDate: (0, mysql_core_1.datetime)('next_review_date'),
    repetitionNumber: (0, mysql_core_1.int)('repetition_number').default(0),
    easinessFactor: (0, mysql_core_1.decimal)('easiness_factor', { precision: 3, scale: 2 }).default('2.5'),
    totalTimeSpent: (0, mysql_core_1.int)('total_time_spent').default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
}, (table) => ({
    uniqueStudentCompetence: (0, mysql_core_1.unique)('unique_student_competence').on(table.studentId, table.competenceId)
}));
// =============================================================================
// TABLE DES SESSIONS D'APPRENTISSAGE
// =============================================================================
exports.learningSessions = (0, mysql_core_1.mysqlTable)('learning_sessions', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull(),
    startedAt: (0, mysql_core_1.datetime)('started_at').notNull(),
    endedAt: (0, mysql_core_1.datetime)('ended_at'),
    exercisesCompleted: (0, mysql_core_1.int)('exercises_completed').default(0),
    totalXpGained: (0, mysql_core_1.int)('total_xp_gained').default(0),
    performanceScore: (0, mysql_core_1.decimal)('performance_score', { precision: 3, scale: 2 }),
    sessionDuration: (0, mysql_core_1.int)('session_duration').default(0),
    competencesWorked: (0, mysql_core_1.json)('competences_worked'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
});
// =============================================================================
// TABLE DES RÉSULTATS D'EXERCICES
// =============================================================================
exports.exerciseResults = (0, mysql_core_1.mysqlTable)('exercise_results', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    sessionId: (0, mysql_core_1.int)('session_id').notNull(),
    studentId: (0, mysql_core_1.int)('student_id').notNull(),
    exerciseId: (0, mysql_core_1.int)('exercise_id').notNull(),
    competenceId: (0, mysql_core_1.int)('competence_id').notNull(),
    isCorrect: (0, mysql_core_1.boolean)('is_correct').notNull(),
    timeSpent: (0, mysql_core_1.int)('time_spent').default(0),
    hintsUsed: (0, mysql_core_1.int)('hints_used').default(0),
    supermemoQuality: (0, mysql_core_1.int)('supermemo_quality').default(3),
    answerGiven: (0, mysql_core_1.text)('answer_given'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
});
// =============================================================================
// TABLE DES MASCOTS
// =============================================================================
exports.mascots = (0, mysql_core_1.mysqlTable)('mascots', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().unique(),
    type: (0, mysql_core_1.mysqlEnum)('type', ['dragon', 'fairy', 'robot', 'cat', 'owl']).default('dragon'),
    currentEmotion: (0, mysql_core_1.mysqlEnum)('current_emotion', ['idle', 'happy', 'thinking', 'celebrating', 'oops']).default('happy'),
    xpLevel: (0, mysql_core_1.int)('xp_level').default(1),
    equippedItems: (0, mysql_core_1.json)('equipped_items').default('[]'),
    aiState: (0, mysql_core_1.json)('ai_state'),
    lastInteraction: (0, mysql_core_1.datetime)('last_interaction'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
});
// =============================================================================
// TABLE DES OBJETS DE GARDE-ROBE
// =============================================================================
exports.wardrobeItems = (0, mysql_core_1.mysqlTable)('wardrobe_items', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 100 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)('type', ['hat', 'clothing', 'accessory', 'shoes', 'special']).notNull(),
    rarity: (0, mysql_core_1.mysqlEnum)('rarity', ['common', 'rare', 'epic', 'legendary']).default('common'),
    unlockRequirementType: (0, mysql_core_1.mysqlEnum)('unlock_requirement_type', ['xp', 'streak', 'exercises', 'achievement']).notNull(),
    unlockRequirementValue: (0, mysql_core_1.int)('unlock_requirement_value').notNull(),
    mascotCompatibility: (0, mysql_core_1.json)('mascot_compatibility'),
    positionData: (0, mysql_core_1.json)('position_data'),
    color: (0, mysql_core_1.int)('color').default(0xFFFFFF),
    geometryType: (0, mysql_core_1.varchar)('geometry_type', { length: 20 }).default('box'),
    magicalEffect: (0, mysql_core_1.boolean)('magical_effect').default(false),
    description: (0, mysql_core_1.text)('description'),
    icon: (0, mysql_core_1.varchar)('icon', { length: 10 }),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
});
// =============================================================================
// TABLE DE LA GARDE-ROBE DES ÉLÈVES
// =============================================================================
exports.studentWardrobe = (0, mysql_core_1.mysqlTable)('student_wardrobe', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull(),
    itemId: (0, mysql_core_1.int)('item_id').notNull(),
    unlockedAt: (0, mysql_core_1.timestamp)('unlocked_at').defaultNow(),
    isEquipped: (0, mysql_core_1.boolean)('is_equipped').default(false),
    equippedAt: (0, mysql_core_1.datetime)('equipped_at'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
}, (table) => ({
    uniqueStudentItem: (0, mysql_core_1.unique)('unique_student_item').on(table.studentId, table.itemId)
}));
// =============================================================================
// TABLE DES RÉALISATIONS
// =============================================================================
exports.achievements = (0, mysql_core_1.mysqlTable)('achievements', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)('description'),
    icon: (0, mysql_core_1.varchar)('icon', { length: 10 }),
    requirementType: (0, mysql_core_1.mysqlEnum)('requirement_type', ['xp', 'streak', 'exercises', 'competences']).notNull(),
    requirementValue: (0, mysql_core_1.int)('requirement_value').notNull(),
    xpReward: (0, mysql_core_1.int)('xp_reward').default(0),
    rarity: (0, mysql_core_1.mysqlEnum)('rarity', ['common', 'rare', 'epic', 'legendary']).default('common'),
    isActive: (0, mysql_core_1.boolean)('is_active').default(true),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
});
// =============================================================================
// TABLE DES RÉALISATIONS DÉBLOQUÉES
// =============================================================================
exports.studentAchievements = (0, mysql_core_1.mysqlTable)('student_achievements', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull(),
    achievementId: (0, mysql_core_1.int)('achievement_id').notNull(),
    unlockedAt: (0, mysql_core_1.timestamp)('unlocked_at').defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow()
}, (table) => ({
    uniqueStudentAchievement: (0, mysql_core_1.unique)('unique_student_achievement').on(table.studentId, table.achievementId)
}));
// =============================================================================
// TABLE DES STATISTIQUES
// =============================================================================
exports.studentStats = (0, mysql_core_1.mysqlTable)('student_stats', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    studentId: (0, mysql_core_1.int)('student_id').notNull().unique(),
    totalExercisesCompleted: (0, mysql_core_1.int)('total_exercises_completed').default(0),
    totalCorrectAnswers: (0, mysql_core_1.int)('total_correct_answers').default(0),
    totalTimeSpent: (0, mysql_core_1.int)('total_time_spent').default(0),
    averagePerformance: (0, mysql_core_1.decimal)('average_performance', { precision: 3, scale: 2 }).default('0.00'),
    longestStreak: (0, mysql_core_1.int)('longest_streak').default(0),
    competencesMastered: (0, mysql_core_1.int)('competences_mastered').default(0),
    totalAchievements: (0, mysql_core_1.int)('total_achievements').default(0),
    lastActivity: (0, mysql_core_1.datetime)('last_activity'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').defaultNow().onUpdateNow()
});
