"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const schema_mysql_cp2025_1 = require("../db/schema-mysql-cp2025");
const connection_1 = require("../db/connection");
async function mascotsRoutes(fastify) {
    const db = (0, connection_1.getDatabase)();
    // GET /api/mascots/:studentId - Get student's mascot
    fastify.get('/:studentId', {
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
                // Get mascot data
                const mascotData = await db
                    .select({
                    id: schema_mysql_cp2025_1.mascots.id,
                    studentId: schema_mysql_cp2025_1.mascots.studentId,
                    type: schema_mysql_cp2025_1.mascots.type,
                    currentEmotion: schema_mysql_cp2025_1.mascots.currentEmotion,
                    xpLevel: schema_mysql_cp2025_1.mascots.xpLevel,
                    equippedItems: schema_mysql_cp2025_1.mascots.equippedItems,
                    aiState: schema_mysql_cp2025_1.mascots.aiState,
                    lastInteraction: schema_mysql_cp2025_1.mascots.lastInteraction,
                    createdAt: schema_mysql_cp2025_1.mascots.createdAt,
                    updatedAt: schema_mysql_cp2025_1.mascots.updatedAt
                })
                    .from(schema_mysql_cp2025_1.mascots)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)))
                    .limit(1);
                if (mascotData.length === 0) {
                    // Create default mascot if none exists
                    const defaultAiState = {
                        mood: 'happy',
                        energy: 100,
                        lastEncouragement: null,
                        personalityTraits: ['enthusiastic', 'helpful']
                    };
                    const newMascot = await db
                        .insert(schema_mysql_cp2025_1.mascots)
                        .values({
                        studentId: parseInt(studentId),
                        type: 'dragon',
                        currentEmotion: 'happy',
                        xpLevel: 1,
                        equippedItems: JSON.stringify([]),
                        aiState: JSON.stringify(defaultAiState)
                    });
                    const createdMascot = await db
                        .select()
                        .from(schema_mysql_cp2025_1.mascots)
                        .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)))
                        .limit(1);
                    return reply.send({
                        success: true,
                        data: {
                            mascot: createdMascot[0]
                        },
                        message: 'Nouveau mascot créé avec succès'
                    });
                }
                return reply.send({
                    success: true,
                    data: {
                        mascot: mascotData[0]
                    }
                });
            }
            catch (error) {
                fastify.log.error('Get mascot error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération du mascot',
                        code: 'GET_MASCOT_ERROR'
                    }
                });
            }
        }
    });
    // PUT /api/mascots/:studentId - Update mascot (emotions, wardrobe)
    fastify.put('/:studentId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['dragon', 'fairy', 'robot', 'cat', 'owl'] },
                    currentEmotion: { type: 'string', enum: ['idle', 'happy', 'thinking', 'celebrating', 'oops'] },
                    equippedItems: { type: 'array', items: { type: 'number' } },
                    aiState: { type: 'object' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const updates = request.body;
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
                // Build update object
                const updateData = {
                    updatedAt: new Date(),
                    lastInteraction: new Date()
                };
                if (updates.type)
                    updateData.type = updates.type;
                if (updates.currentEmotion)
                    updateData.currentEmotion = updates.currentEmotion;
                if (updates.equippedItems)
                    updateData.equippedItems = JSON.stringify(updates.equippedItems);
                if (updates.aiState)
                    updateData.aiState = JSON.stringify(updates.aiState);
                // Update mascot
                await db
                    .update(schema_mysql_cp2025_1.mascots)
                    .set(updateData)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)));
                // Get updated mascot
                const updatedMascot = await db
                    .select()
                    .from(schema_mysql_cp2025_1.mascots)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)))
                    .limit(1);
                return reply.send({
                    success: true,
                    data: {
                        mascot: updatedMascot[0]
                    },
                    message: 'Mascot mis à jour avec succès'
                });
            }
            catch (error) {
                fastify.log.error('Update mascot error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la mise à jour du mascot',
                        code: 'UPDATE_MASCOT_ERROR'
                    }
                });
            }
        }
    });
    // POST /api/mascots/:studentId/emotion - Update mascot emotion based on performance
    fastify.post('/:studentId/emotion', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                required: ['performance'],
                properties: {
                    performance: { type: 'string', enum: ['excellent', 'good', 'average', 'poor'] },
                    context: { type: 'string', enum: ['exercise_complete', 'streak_achieved', 'level_up', 'mistake_made'] }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const { performance, context } = request.body;
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
                // Determine emotion based on performance and context
                let newEmotion = 'idle';
                if (context === 'level_up' || performance === 'excellent') {
                    newEmotion = 'celebrating';
                }
                else if (performance === 'good' || context === 'streak_achieved') {
                    newEmotion = 'happy';
                }
                else if (performance === 'poor' || context === 'mistake_made') {
                    newEmotion = 'oops';
                }
                else if (context === 'exercise_complete') {
                    newEmotion = 'thinking';
                }
                // Get current mascot state
                const currentMascot = await db
                    .select()
                    .from(schema_mysql_cp2025_1.mascots)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)))
                    .limit(1);
                if (currentMascot.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Mascot introuvable',
                            code: 'MASCOT_NOT_FOUND'
                        }
                    });
                }
                // Update AI state with performance context
                const currentAiState = currentMascot[0].aiState ? JSON.parse(currentMascot[0].aiState) : {
                    mood: 'happy',
                    energy: 50,
                    personalityTraits: ['enthusiastic', 'helpful']
                };
                const updatedAiState = {
                    ...currentAiState,
                    mood: newEmotion,
                    lastPerformance: performance,
                    lastContext: context,
                    energy: performance === 'excellent' ? Math.min(100, (currentAiState.energy || 50) + 20) :
                        performance === 'poor' ? Math.max(20, (currentAiState.energy || 50) - 10) :
                            currentAiState.energy || 50,
                    lastUpdate: new Date().toISOString()
                };
                // Update mascot
                await db
                    .update(schema_mysql_cp2025_1.mascots)
                    .set({
                    currentEmotion: newEmotion,
                    aiState: JSON.stringify(updatedAiState),
                    lastInteraction: new Date(),
                    updatedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)));
                return reply.send({
                    success: true,
                    data: {
                        emotion: newEmotion,
                        aiState: updatedAiState,
                        message: `Mascot réagit à la performance: ${performance}`
                    }
                });
            }
            catch (error) {
                fastify.log.error('Update mascot emotion error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la mise à jour de l\'émotion du mascot',
                        code: 'UPDATE_EMOTION_ERROR'
                    }
                });
            }
        }
    });
    // GET /api/mascots/:studentId/dialogue - Get contextual dialogue for mascot
    fastify.get('/:studentId/dialogue', {
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
                    context: { type: 'string', enum: ['greeting', 'encouragement', 'celebration', 'help', 'goodbye'] }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const { context = 'greeting' } = request.query;
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
                // Get mascot data
                const mascotData = await db
                    .select()
                    .from(schema_mysql_cp2025_1.mascots)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.mascots.studentId, parseInt(studentId)))
                    .limit(1);
                if (mascotData.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Mascot introuvable',
                            code: 'MASCOT_NOT_FOUND'
                        }
                    });
                }
                const mascot = mascotData[0];
                const aiState = mascot.aiState ? JSON.parse(mascot.aiState) : {
                    mood: 'happy',
                    energy: 50,
                    personalityTraits: ['enthusiastic', 'helpful']
                };
                // Generate contextual dialogue based on mascot type and current state
                const dialogues = {
                    dragon: {
                        greeting: "Bonjour mon brave aventurier ! Prêt à conquérir de nouveaux défis aujourd'hui ? 🐉✨",
                        encouragement: "Tu es plus fort qu'un dragon ! Continue comme ça ! 💪🔥",
                        celebration: "MAGNIFIQUE ! Tu brilles comme un trésor ! 🏆✨",
                        help: "N'hésite pas, je suis là pour t'aider ! Les dragons sont très sages tu sais ! 🤓",
                        goodbye: "À bientôt mon champion ! Garde ta flamme allumée ! 🔥👋"
                    },
                    fairy: {
                        greeting: "Bonjour petite étoile ! ✨ Prêt(e) à faire de la magie avec tes apprentissages ?",
                        encouragement: "Crois en toi, tu as une magie spéciale ! 🌟💫",
                        celebration: "Tu rayonnes de mille feux ! Bravo ! ✨🎉",
                        help: "Je saupoudre un peu de poussière magique pour t'aider ! ✨🪄",
                        goodbye: "Vole vers de nouveaux succès ! À très bientôt ! 🧚‍♀️✨"
                    },
                    robot: {
                        greeting: "Système activé ! Bonjour utilisateur ! Prêt pour l'apprentissage optimal ? 🤖",
                        encouragement: "Calcul en cours... Résultat : TU ES GÉNIAL ! 💻✅",
                        celebration: "SUCCÈS DÉTECTÉ ! Performances exceptionnelles ! 🎯🤖",
                        help: "Analyse des données... Je t'assiste dans ta mission ! 📊🔧",
                        goodbye: "Système en veille. À la prochaine connexion ! 🤖👋"
                    },
                    cat: {
                        greeting: "Miaou ! Bonjour mon petit humain ! 🐱 Prêt à jouer et apprendre ?",
                        encouragement: "Tu es purrfait ! Continue sur ta lancée ! 😸💝",
                        celebration: "Miaou miaou ! Tu mérites toutes les caresses ! 🐾🎉",
                        help: "Un petit ronron d'encouragement ! Je suis là ! 🐱💕",
                        goodbye: "Miaou ! N'oublie pas de revenir jouer avec moi ! 🐾👋"
                    },
                    owl: {
                        greeting: "Hou hou ! Bonjour sage élève ! 🦉 Prêt à acquérir de nouvelles connaissances ?",
                        encouragement: "Sage décision ! Tu apprends avec sagesse ! 🦉📚",
                        celebration: "Excellent ! Ta sagesse grandit ! 🦉🏆",
                        help: "Laisse-moi partager ma sagesse avec toi ! 🦉🎓",
                        goodbye: "Hou hou ! Continue à voler vers le savoir ! 🦉✈️"
                    }
                };
                const mascotDialogues = dialogues[mascot.type || 'dragon'] || dialogues.dragon;
                const dialogue = mascotDialogues[context] || mascotDialogues.greeting;
                return reply.send({
                    success: true,
                    data: {
                        dialogue,
                        mascotType: mascot.type,
                        emotion: mascot.currentEmotion,
                        context,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                fastify.log.error('Get mascot dialogue error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération du dialogue',
                        code: 'GET_DIALOGUE_ERROR'
                    }
                });
            }
        }
    });
}
exports.default = mascotsRoutes;
