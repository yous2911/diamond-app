"use strict";
/**
 * REAL-TIME PROGRESS TRACKING SERVICE
 * Handles live progress updates, notifications, and parent alerts
 * Uses WebSocket for instant updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realTimeProgressService = void 0;
const ws_1 = require("ws");
const connection_js_1 = require("../db/connection.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
class RealTimeProgressService {
    constructor() {
        this.connections = new Map();
        this.parentNotifications = new Map();
    }
    /**
     * Register WebSocket connection
     */
    registerConnection(connectionId, ws, userId, userType) {
        this.connections.set(connectionId, { ws, userId, userType });
        ws.on('close', () => {
            this.connections.delete(connectionId);
        });
        // Send cached notifications for parents
        if (userType === 'parent') {
            const cached = this.parentNotifications.get(userId) || [];
            if (cached.length > 0) {
                this.sendToConnection(connectionId, {
                    type: 'cached_notifications',
                    notifications: cached
                });
            }
        }
    }
    /**
     * Track exercise completion with real-time updates
     */
    async trackExerciseCompletion(studentId, exerciseData) {
        const student = await connection_js_1.db.select().from(schema_js_1.students).where((0, drizzle_orm_1.eq)(schema_js_1.students.id, studentId)).limit(1);
        if (!student.length)
            return;
        const progressUpdate = {
            type: 'exercise_completed',
            studentId,
            data: {
                exerciseId: exerciseData.exerciseId,
                score: exerciseData.score,
                timeSpent: exerciseData.timeSpent,
                isCorrect: exerciseData.isCorrect,
                competencyCode: exerciseData.competencyCode,
                studentName: `${student[0].prenom} ${student[0].nom}`
            },
            timestamp: new Date()
        };
        // Real-time update to student
        this.broadcastToStudent(studentId, {
            type: 'progress_update',
            update: progressUpdate
        });
        // Check for achievements and milestones
        await this.checkAndTriggerMilestones(studentId, exerciseData);
        // Notify parents
        await this.notifyParents(studentId, progressUpdate);
    }
    /**
     * Track level up with celebration
     */
    async trackLevelUp(studentId, newLevel, xpGained) {
        const student = await connection_js_1.db.select().from(schema_js_1.students).where((0, drizzle_orm_1.eq)(schema_js_1.students.id, studentId)).limit(1);
        if (!student.length)
            return;
        const progressUpdate = {
            type: 'level_up',
            studentId,
            data: {
                newLevel,
                xpGained,
                studentName: `${student[0].prenom} ${student[0].nom}`
            },
            timestamp: new Date()
        };
        // Celebration update to student
        this.broadcastToStudent(studentId, {
            type: 'level_up_celebration',
            update: progressUpdate,
            celebration: {
                title: `Niveau ${newLevel} atteint !`,
                message: `Félicitations ! Tu as gagné ${xpGained} XP !`,
                confetti: true,
                duration: 5000
            }
        });
        // Notify parents about milestone
        await this.notifyParents(studentId, progressUpdate);
    }
    /**
     * Track streak milestones
     */
    async trackStreakMilestone(studentId, streak) {
        const student = await connection_js_1.db.select().from(schema_js_1.students).where((0, drizzle_orm_1.eq)(schema_js_1.students.id, studentId)).limit(1);
        if (!student.length)
            return;
        const isImportantMilestone = [3, 7, 14, 30, 50, 100].includes(streak);
        if (!isImportantMilestone)
            return;
        const progressUpdate = {
            type: 'streak_milestone',
            studentId,
            data: {
                streak,
                studentName: `${student[0].prenom} ${student[0].nom}`,
                milestone: this.getStreakMilestone(streak)
            },
            timestamp: new Date()
        };
        // Celebration for student
        this.broadcastToStudent(studentId, {
            type: 'streak_celebration',
            update: progressUpdate,
            celebration: {
                title: `${streak} jours consécutifs ! 🔥`,
                message: this.getStreakMessage(streak),
                confetti: true,
                duration: 4000
            }
        });
        // Important milestone notification for parents
        await this.notifyParents(studentId, progressUpdate);
    }
    /**
     * Check and trigger various milestones
     */
    async checkAndTriggerMilestones(studentId, exerciseData) {
        // Check daily goal completion
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayExercises = await connection_js_1.db
            .select()
            .from(schema_js_1.studentProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema_js_1.studentProgress.completed, true), (0, drizzle_orm_1.gte)(schema_js_1.studentProgress.completedAt, today)));
        const dailyGoalTargets = [3, 5, 10, 15]; // Progressive goals
        const todayCount = todayExercises.length;
        if (dailyGoalTargets.includes(todayCount)) {
            this.broadcastToStudent(studentId, {
                type: 'daily_goal_achieved',
                data: {
                    exercisesCompleted: todayCount,
                    message: `Objectif quotidien atteint : ${todayCount} exercices !`,
                    reward: this.getDailyGoalReward(todayCount)
                }
            });
        }
        // Check competency mastery
        const competencyProgress = await connection_js_1.db
            .select()
            .from(schema_js_1.studentProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema_js_1.studentProgress.competenceCode, exerciseData.competencyCode)));
        const totalAttempts = competencyProgress.length;
        const correctAttempts = competencyProgress.filter(p => p.score && parseFloat(p.score.toString()) >= 80).length;
        const masteryRatio = correctAttempts / totalAttempts;
        if (totalAttempts >= 3 && masteryRatio >= 0.8) {
            await this.trackCompetencyMastery(studentId, exerciseData.competencyCode, masteryRatio);
        }
    }
    /**
     * Track competency mastery
     */
    async trackCompetencyMastery(studentId, competencyCode, masteryLevel) {
        const student = await connection_js_1.db.select().from(schema_js_1.students).where((0, drizzle_orm_1.eq)(schema_js_1.students.id, studentId)).limit(1);
        if (!student.length)
            return;
        // Create achievement record
        await connection_js_1.db.insert(schema_js_1.studentAchievements).values({
            studentId,
            achievementType: 'competency_master',
            achievementCode: `mastery_${competencyCode}`,
            title: 'Compétence maîtrisée',
            description: `Maîtrise de la compétence ${competencyCode}`,
            xpReward: 100,
            unlockedAt: new Date()
        });
        const progressUpdate = {
            type: 'competency_mastered',
            studentId,
            data: {
                competencyCode,
                masteryLevel,
                studentName: `${student[0].prenom} ${student[0].nom}`,
                xpReward: 100
            },
            timestamp: new Date()
        };
        // Celebration for student
        this.broadcastToStudent(studentId, {
            type: 'competency_mastery_celebration',
            update: progressUpdate,
            celebration: {
                title: '🎯 Compétence maîtrisée !',
                message: `Excellent ! Tu maîtrises ${competencyCode}`,
                confetti: true,
                duration: 4000
            }
        });
        // Notify parents
        await this.notifyParents(studentId, progressUpdate);
    }
    /**
     * Notify parents about child's progress
     */
    async notifyParents(studentId, progressUpdate) {
        // Get all parents for this student
        const parentRelations = await connection_js_1.db
            .select({
            parentId: schema_js_1.parentStudentRelations.parentId,
            parent: schema_js_1.parents
        })
            .from(schema_js_1.parentStudentRelations)
            .innerJoin(schema_js_1.parents, (0, drizzle_orm_1.eq)(schema_js_1.parents.id, schema_js_1.parentStudentRelations.parentId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.studentId, studentId), (0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.canReceiveReports, true)));
        for (const relation of parentRelations) {
            const notification = this.createParentNotification(progressUpdate, relation.parent);
            // Cache notification
            if (!this.parentNotifications.has(relation.parentId)) {
                this.parentNotifications.set(relation.parentId, []);
            }
            this.parentNotifications.get(relation.parentId).push(notification);
            // Send real-time notification
            this.broadcastToParent(relation.parentId, {
                type: 'child_progress_notification',
                notification
            });
            // Keep only last 10 notifications per parent
            const parentNotifs = this.parentNotifications.get(relation.parentId);
            if (parentNotifs.length > 10) {
                this.parentNotifications.set(relation.parentId, parentNotifs.slice(-10));
            }
        }
    }
    /**
     * Create parent notification from progress update
     */
    createParentNotification(update, parent) {
        const childName = update.data.studentName;
        switch (update.type) {
            case 'exercise_completed':
                return {
                    parentId: parent.id,
                    childName,
                    type: 'daily_goal',
                    title: 'Exercice terminé',
                    message: `${childName} a terminé un exercice avec ${update.data.score}% de réussite`,
                    icon: '📝',
                    color: 'bg-blue-500',
                    priority: 'low'
                };
            case 'level_up':
                return {
                    parentId: parent.id,
                    childName,
                    type: 'milestone',
                    title: 'Niveau supérieur !',
                    message: `${childName} a atteint le niveau ${update.data.newLevel} ! 🎉`,
                    icon: '⭐',
                    color: 'bg-yellow-500',
                    actionUrl: '/parent-dashboard',
                    priority: 'medium'
                };
            case 'streak_milestone':
                return {
                    parentId: parent.id,
                    childName,
                    type: 'streak',
                    title: 'Série impressionnante !',
                    message: `${childName} a maintenu sa série pendant ${update.data.streak} jours ! 🔥`,
                    icon: '🔥',
                    color: 'bg-orange-500',
                    actionUrl: '/parent-dashboard',
                    priority: 'medium'
                };
            case 'competency_mastered':
                return {
                    parentId: parent.id,
                    childName,
                    type: 'achievement',
                    title: 'Compétence maîtrisée !',
                    message: `${childName} a maîtrisé la compétence ${update.data.competencyCode} 🎯`,
                    icon: '🎯',
                    color: 'bg-green-500',
                    actionUrl: '/parent-dashboard',
                    priority: 'high'
                };
            default:
                return {
                    parentId: parent.id,
                    childName,
                    type: 'daily_goal',
                    title: 'Progrès',
                    message: `${childName} continue ses progrès !`,
                    icon: '✨',
                    color: 'bg-purple-500',
                    priority: 'low'
                };
        }
    }
    /**
     * Broadcast message to specific student
     */
    broadcastToStudent(studentId, message) {
        for (const [connectionId, connection] of this.connections) {
            if (connection.userType === 'student' && connection.userId === studentId) {
                if (connection.ws.readyState === ws_1.WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify(message));
                }
            }
        }
    }
    /**
     * Broadcast message to specific parent
     */
    broadcastToParent(parentId, message) {
        for (const [connectionId, connection] of this.connections) {
            if (connection.userType === 'parent' && connection.userId === parentId) {
                if (connection.ws.readyState === ws_1.WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify(message));
                }
            }
        }
    }
    /**
     * Send message to specific connection
     */
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === ws_1.WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    }
    /**
     * Get streak milestone info
     */
    getStreakMilestone(streak) {
        const milestones = {
            3: 'Super Débutant',
            7: 'Une semaine complète',
            14: 'Deux semaines',
            30: 'Un mois entier',
            50: 'Champion de la régularité',
            100: 'Légende de la constance'
        };
        return milestones[streak] || 'Incroyable série';
    }
    /**
     * Get streak celebration message
     */
    getStreakMessage(streak) {
        const messages = {
            3: 'Tu commences vraiment bien !',
            7: 'Une semaine complète, bravo !',
            14: 'Deux semaines, c\'est fantastique !',
            30: 'Un mois entier ! Tu es incroyable !',
            50: 'Cinquante jours ! Tu es un champion !',
            100: 'Cent jours ! Tu es une légende !'
        };
        return messages[streak] || 'Continue comme ça !';
    }
    /**
     * Get daily goal reward
     */
    getDailyGoalReward(exerciseCount) {
        const rewards = {
            3: { xp: 50, badge: 'Premier objectif' },
            5: { xp: 100, badge: 'Travailleur assidu' },
            10: { xp: 200, badge: 'Super studieux' },
            15: { xp: 300, badge: 'Machine à apprendre' }
        };
        return rewards[exerciseCount] || { xp: 25 };
    }
    /**
     * Get parent notifications for specific parent
     */
    getParentNotifications(parentId) {
        return this.parentNotifications.get(parentId) || [];
    }
    /**
     * Mark notifications as read
     */
    markNotificationsAsRead(parentId, notificationIds) {
        const notifications = this.parentNotifications.get(parentId) || [];
        if (notificationIds) {
            // Remove specific notifications
            const filtered = notifications.filter(n => !notificationIds.includes(n.parentId));
            this.parentNotifications.set(parentId, filtered);
        }
        else {
            // Clear all notifications
            this.parentNotifications.set(parentId, []);
        }
    }
}
exports.realTimeProgressService = new RealTimeProgressService();
