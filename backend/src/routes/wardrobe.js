"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const schema_mysql_cp2025_1 = require("../db/schema-mysql-cp2025");
const connection_1 = require("../db/connection");
async function wardrobeRoutes(fastify) {
    const db = (0, connection_1.getDatabase)();
    // GET /api/wardrobe/:studentId - Get student's wardrobe items
    fastify.get('/:studentId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['hat', 'clothing', 'accessory', 'shoes', 'special'] },
                    rarity: { type: 'string', enum: ['common', 'rare', 'epic', 'legendary'] },
                    unlocked: { type: 'boolean' },
                    equipped: { type: 'boolean' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const { type, rarity, unlocked, equipped } = request.query;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Get student's wardrobe items with unlock status
                const baseQuery = db
                    .select({
                    id: schema_mysql_cp2025_1.wardrobeItems.id,
                    name: schema_mysql_cp2025_1.wardrobeItems.name,
                    type: schema_mysql_cp2025_1.wardrobeItems.type,
                    rarity: schema_mysql_cp2025_1.wardrobeItems.rarity,
                    unlockRequirementType: schema_mysql_cp2025_1.wardrobeItems.unlockRequirementType,
                    unlockRequirementValue: schema_mysql_cp2025_1.wardrobeItems.unlockRequirementValue,
                    mascotCompatibility: schema_mysql_cp2025_1.wardrobeItems.mascotCompatibility,
                    positionData: schema_mysql_cp2025_1.wardrobeItems.positionData,
                    color: schema_mysql_cp2025_1.wardrobeItems.color,
                    geometryType: schema_mysql_cp2025_1.wardrobeItems.geometryType,
                    magicalEffect: schema_mysql_cp2025_1.wardrobeItems.magicalEffect,
                    description: schema_mysql_cp2025_1.wardrobeItems.description,
                    icon: schema_mysql_cp2025_1.wardrobeItems.icon,
                    isActive: schema_mysql_cp2025_1.wardrobeItems.isActive,
                    // Unlock status from student_wardrobe
                    isUnlocked: (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.studentWardrobe.studentId} IS NOT NULL`,
                    unlockedAt: schema_mysql_cp2025_1.studentWardrobe.unlockedAt,
                    isEquipped: schema_mysql_cp2025_1.studentWardrobe.isEquipped,
                    equippedAt: schema_mysql_cp2025_1.studentWardrobe.equippedAt
                })
                    .from(schema_mysql_cp2025_1.wardrobeItems)
                    .leftJoin(schema_mysql_cp2025_1.studentWardrobe, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, schema_mysql_cp2025_1.wardrobeItems.id)));
                // Build where conditions
                const whereConditions = [(0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.wardrobeItems.isActive, true)];
                if (type) {
                    whereConditions.push((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.wardrobeItems.type, type));
                }
                if (rarity) {
                    whereConditions.push((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.wardrobeItems.rarity, rarity));
                }
                // Apply all conditions in a single where clause
                const allItems = await baseQuery.where((0, drizzle_orm_1.and)(...whereConditions));
                // Filter by unlock status if specified
                let filteredItems = allItems;
                if (unlocked !== undefined) {
                    filteredItems = allItems.filter(item => unlocked ? item.isUnlocked : !item.isUnlocked);
                }
                if (equipped !== undefined) {
                    filteredItems = filteredItems.filter(item => equipped ? item.isEquipped : !item.isEquipped);
                }
                // Get student stats for unlock requirements
                const studentStatsData = await db
                    .select()
                    .from(schema_mysql_cp2025_1.studentStats)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentStats.studentId, parseInt(studentId)))
                    .limit(1);
                const stats = studentStatsData[0] || {
                    totalExercisesCompleted: 0,
                    totalCorrectAnswers: 0,
                    longestStreak: 0,
                    competencesMastered: 0,
                    totalAchievements: 0
                };
                // Check which items can be unlocked
                const itemsWithUnlockStatus = filteredItems.map(item => ({
                    ...item,
                    canUnlock: !item.isUnlocked && checkUnlockRequirement(item, stats),
                    progressToUnlock: calculateUnlockProgress(item, stats)
                }));
                return reply.send({
                    success: true,
                    data: {
                        items: itemsWithUnlockStatus,
                        summary: {
                            total: filteredItems.length,
                            unlocked: filteredItems.filter(item => item.isUnlocked).length,
                            equipped: filteredItems.filter(item => item.isEquipped).length,
                            canUnlock: itemsWithUnlockStatus.filter(item => item.canUnlock).length
                        },
                        studentStats: stats
                    }
                });
            }
            catch (error) {
                console.error('Get wardrobe error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération de la garde-robe',
                        code: 'GET_WARDROBE_ERROR'
                    }
                });
            }
        }
    });
    // POST /api/wardrobe/:studentId/unlock/:itemId - Unlock wardrobe item
    fastify.post('/:studentId/unlock/:itemId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId', 'itemId'],
                properties: {
                    studentId: { type: 'string' },
                    itemId: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId, itemId } = request.params;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Check if item exists and is not already unlocked
                const existingUnlock = await db
                    .select()
                    .from(schema_mysql_cp2025_1.studentWardrobe)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, parseInt(itemId))))
                    .limit(1);
                if (existingUnlock.length > 0) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            message: 'Objet déjà débloqué',
                            code: 'ALREADY_UNLOCKED'
                        }
                    });
                }
                // Get item details
                const itemData = await db
                    .select()
                    .from(schema_mysql_cp2025_1.wardrobeItems)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.wardrobeItems.id, parseInt(itemId)))
                    .limit(1);
                if (itemData.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Objet introuvable',
                            code: 'ITEM_NOT_FOUND'
                        }
                    });
                }
                const item = itemData[0];
                // Get student stats to verify unlock requirements
                const studentStatsData = await db
                    .select()
                    .from(schema_mysql_cp2025_1.studentStats)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentStats.studentId, parseInt(studentId)))
                    .limit(1);
                const stats = studentStatsData[0];
                if (!stats || !checkUnlockRequirement(item, stats)) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            message: 'Conditions de déblocage non remplies',
                            code: 'UNLOCK_REQUIREMENTS_NOT_MET',
                            details: {
                                requirementType: item.unlockRequirementType,
                                requirementValue: item.unlockRequirementValue,
                                currentProgress: getCurrentProgress(item, stats)
                            }
                        }
                    });
                }
                // Unlock the item
                const unlockResult = await db
                    .insert(schema_mysql_cp2025_1.studentWardrobe)
                    .values({
                    studentId: parseInt(studentId),
                    itemId: parseInt(itemId),
                    unlockedAt: new Date(),
                    isEquipped: false
                });
                return reply.send({
                    success: true,
                    data: {
                        item: {
                            id: item.id,
                            name: item.name,
                            type: item.type,
                            rarity: item.rarity,
                            description: item.description,
                            icon: item.icon
                        },
                        unlockedAt: new Date()
                    },
                    message: `${item.name} a été débloqué avec succès !`
                });
            }
            catch (error) {
                console.error('Unlock wardrobe item error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors du déblocage de l\'objet',
                        code: 'UNLOCK_ITEM_ERROR'
                    }
                });
            }
        }
    });
    // POST /api/wardrobe/:studentId/equip/:itemId - Equip wardrobe item
    fastify.post('/:studentId/equip/:itemId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId', 'itemId'],
                properties: {
                    studentId: { type: 'string' },
                    itemId: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId, itemId } = request.params;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Check if item is unlocked by student
                const studentItem = await db
                    .select({
                    id: schema_mysql_cp2025_1.studentWardrobe.id,
                    itemId: schema_mysql_cp2025_1.studentWardrobe.itemId,
                    isEquipped: schema_mysql_cp2025_1.studentWardrobe.isEquipped,
                    itemType: schema_mysql_cp2025_1.wardrobeItems.type,
                    itemName: schema_mysql_cp2025_1.wardrobeItems.name
                })
                    .from(schema_mysql_cp2025_1.studentWardrobe)
                    .innerJoin(schema_mysql_cp2025_1.wardrobeItems, (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, schema_mysql_cp2025_1.wardrobeItems.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, parseInt(itemId))))
                    .limit(1);
                if (studentItem.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Objet non débloqué ou introuvable',
                            code: 'ITEM_NOT_UNLOCKED'
                        }
                    });
                }
                const item = studentItem[0];
                // Unequip other items of the same type (only one hat, one clothing, etc.)
                // First get all items of the same type for this student
                const sameTypeItems = await db
                    .select({ id: schema_mysql_cp2025_1.studentWardrobe.id })
                    .from(schema_mysql_cp2025_1.studentWardrobe)
                    .innerJoin(schema_mysql_cp2025_1.wardrobeItems, (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, schema_mysql_cp2025_1.wardrobeItems.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.wardrobeItems.type, item.itemType)));
                // Unequip all items of the same type
                for (const sameTypeItem of sameTypeItems) {
                    await db
                        .update(schema_mysql_cp2025_1.studentWardrobe)
                        .set({
                        isEquipped: false,
                        equippedAt: null
                    })
                        .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.id, sameTypeItem.id));
                }
                // Equip the selected item
                await db
                    .update(schema_mysql_cp2025_1.studentWardrobe)
                    .set({
                    isEquipped: true,
                    equippedAt: new Date()
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, parseInt(itemId))));
                return reply.send({
                    success: true,
                    data: {
                        itemId: parseInt(itemId),
                        itemName: item.itemName,
                        itemType: item.itemType,
                        equipped: true,
                        equippedAt: new Date()
                    },
                    message: `${item.itemName} équipé avec succès !`
                });
            }
            catch (error) {
                console.error('Equip wardrobe item error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de l\'équipement de l\'objet',
                        code: 'EQUIP_ITEM_ERROR'
                    }
                });
            }
        }
    });
    // POST /api/wardrobe/:studentId/unequip/:itemId - Unequip wardrobe item
    fastify.post('/:studentId/unequip/:itemId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId', 'itemId'],
                properties: {
                    studentId: { type: 'string' },
                    itemId: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId, itemId } = request.params;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Unequip the item
                const result = await db
                    .update(schema_mysql_cp2025_1.studentWardrobe)
                    .set({
                    isEquipped: false,
                    equippedAt: null
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, parseInt(itemId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.isEquipped, true)));
                return reply.send({
                    success: true,
                    data: {
                        itemId: parseInt(itemId),
                        equipped: false,
                        unequippedAt: new Date()
                    },
                    message: 'Objet retiré avec succès !'
                });
            }
            catch (error) {
                console.error('Unequip wardrobe item error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors du retrait de l\'objet',
                        code: 'UNEQUIP_ITEM_ERROR'
                    }
                });
            }
        }
    });
    // GET /api/wardrobe/:studentId/equipped - Get equipped items
    fastify.get('/:studentId/equipped', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Get equipped items
                const equippedItems = await db
                    .select({
                    id: schema_mysql_cp2025_1.wardrobeItems.id,
                    name: schema_mysql_cp2025_1.wardrobeItems.name,
                    type: schema_mysql_cp2025_1.wardrobeItems.type,
                    rarity: schema_mysql_cp2025_1.wardrobeItems.rarity,
                    positionData: schema_mysql_cp2025_1.wardrobeItems.positionData,
                    color: schema_mysql_cp2025_1.wardrobeItems.color,
                    geometryType: schema_mysql_cp2025_1.wardrobeItems.geometryType,
                    magicalEffect: schema_mysql_cp2025_1.wardrobeItems.magicalEffect,
                    description: schema_mysql_cp2025_1.wardrobeItems.description,
                    icon: schema_mysql_cp2025_1.wardrobeItems.icon,
                    equippedAt: schema_mysql_cp2025_1.studentWardrobe.equippedAt
                })
                    .from(schema_mysql_cp2025_1.studentWardrobe)
                    .innerJoin(schema_mysql_cp2025_1.wardrobeItems, (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.itemId, schema_mysql_cp2025_1.wardrobeItems.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.studentId, parseInt(studentId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.studentWardrobe.isEquipped, true)));
                return reply.send({
                    success: true,
                    data: {
                        equippedItems,
                        count: equippedItems.length,
                        byType: {
                            hat: equippedItems.filter(item => item.type === 'hat'),
                            clothing: equippedItems.filter(item => item.type === 'clothing'),
                            accessory: equippedItems.filter(item => item.type === 'accessory'),
                            shoes: equippedItems.filter(item => item.type === 'shoes'),
                            special: equippedItems.filter(item => item.type === 'special')
                        }
                    }
                });
            }
            catch (error) {
                console.error('Get equipped items error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des objets équipés',
                        code: 'GET_EQUIPPED_ITEMS_ERROR'
                    }
                });
            }
        }
    });
}
exports.default = wardrobeRoutes;
// Helper functions
function checkUnlockRequirement(item, stats) {
    if (!stats)
        return false;
    switch (item.unlockRequirementType) {
        case 'xp':
            // This would need to be calculated from student table
            return true; // Simplified for now
        case 'streak':
            return stats.longestStreak >= item.unlockRequirementValue;
        case 'exercises':
            return stats.totalExercisesCompleted >= item.unlockRequirementValue;
        case 'achievement':
            return stats.totalAchievements >= item.unlockRequirementValue;
        default:
            return false;
    }
}
function getCurrentProgress(item, stats) {
    if (!stats)
        return 0;
    switch (item.unlockRequirementType) {
        case 'xp':
            return 0; // Would need to calculate from student table
        case 'streak':
            return stats.longestStreak;
        case 'exercises':
            return stats.totalExercisesCompleted;
        case 'achievement':
            return stats.totalAchievements;
        default:
            return 0;
    }
}
function calculateUnlockProgress(item, stats) {
    const current = getCurrentProgress(item, stats);
    const required = item.unlockRequirementValue;
    return Math.min(100, Math.round((current / required) * 100));
}
