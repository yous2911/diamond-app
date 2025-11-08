"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLeaderboards = void 0;
const connection_1 = require("./connection");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Simple seed data for leaderboards - using basic student data
 */
async function seedLeaderboards() {
    try {
        console.log('🌱 Seeding leaderboard data...');
        // Get existing students
        const students = await connection_1.db.execute((0, drizzle_orm_1.sql) `SELECT id, prenom, nom FROM students LIMIT 10`);
        if (!students || !Array.isArray(students[0]) || students[0].length === 0) {
            console.log('⚠️ No students found in database');
            return;
        }
        console.log(`👥 Found ${students.length} students`);
        // Clear existing data
        await connection_1.db.execute((0, drizzle_orm_1.sql) `DELETE FROM leaderboards`);
        await connection_1.db.execute((0, drizzle_orm_1.sql) `DELETE FROM student_badges`);
        await connection_1.db.execute((0, drizzle_orm_1.sql) `DELETE FROM competitions`);
        // Create sample leaderboard entries
        const leaderboardData = students.map((student, index) => {
            const score = Math.floor(Math.random() * 1000) + 500; // 500-1500 points
            const rank = index + 1;
            return {
                student_id: student.id,
                student_name: `${student.prenom} ${student.nom}`,
                score,
                rank
            };
        });
        // Sort by score descending
        leaderboardData.sort((a, b) => b.score - a.score);
        // Update ranks after sorting
        leaderboardData.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        // Insert leaderboard entries one by one
        for (const entry of leaderboardData) {
            await connection_1.db.execute((0, drizzle_orm_1.sql) `
        INSERT INTO leaderboards 
        (type, category, student_id, score, \`rank\`, period, metadata, created_at) 
        VALUES 
        ('global', 'points', ${entry.student_id}, ${entry.score}, ${entry.rank}, 
         'all-time', JSON_OBJECT('name', ${entry.student_name}), NOW())
      `);
        }
        // Create competitions
        await connection_1.db.execute((0, drizzle_orm_1.sql) `
      INSERT INTO competitions 
      (id, name, description, type, start_date, end_date, participants, rewards, active) 
      VALUES 
      (1, '🚀 Défi de la Semaine', 'Complétez 20 exercices cette semaine !', 
       'weekly_challenge', NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 5 DAY, 
       ${Math.floor(students.length * 0.6)}, JSON_ARRAY('🏆 Badge Spécial', '💎 100 Points Bonus'), true),
       
      (2, '⚡ Marathon Mathématique', 'Résolvez un maximum d\\'exercices de maths !', 
       'monthly_competition', NOW() - INTERVAL 10 DAY, NOW() + INTERVAL 20 DAY,
       ${Math.floor(students.length * 0.8)}, JSON_ARRAY('👑 Couronne Dorée', '🎁 Surprise Spéciale'), true)
    `);
        // Award badges to top 3
        const topStudents = leaderboardData.slice(0, 3);
        const badgeTypes = [
            { type: 'first_place_global', title: '👑 Champion Mondial', description: 'Numéro 1 du classement !', rarity: 'legendary' },
            { type: 'top_3_global', title: '🥈 Podium Mondial', description: 'Dans le top 3 mondial !', rarity: 'epic' },
            { type: 'top_10_global', title: '🏆 Top 10 Mondial', description: 'Dans le top 10 !', rarity: 'rare' }
        ];
        for (let i = 0; i < topStudents.length; i++) {
            const student = topStudents[i];
            const badge = badgeTypes[Math.min(i, badgeTypes.length - 1)];
            await connection_1.db.execute((0, drizzle_orm_1.sql) `
        INSERT INTO student_badges 
        (student_id, badge_type, title, description, rarity, metadata, earned_at) 
        VALUES 
        (${student.student_id}, ${badge.type}, ${badge.title}, ${badge.description}, 
         ${badge.rarity}, JSON_OBJECT('rank', ${student.rank}, 'score', ${student.score}), NOW())
      `);
        }
        console.log(`✅ Seeded leaderboard with ${leaderboardData.length} entries`);
        console.log(`🏅 Awarded ${topStudents.length} badges`);
        console.log(`🎮 Created 2 competitions`);
        console.log('🎉 Leaderboard seeding completed!');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
exports.seedLeaderboards = seedLeaderboards;
// Run seeding
if (require.main === module) {
    seedLeaderboards()
        .then(() => {
        console.log('🎯 All done!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    });
}
