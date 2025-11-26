import { db } from './connection';
import { sql } from 'drizzle-orm';

/**
 * Simple seed data for leaderboards - using basic student data
 */
async function seedLeaderboards() {
  try {
    console.log('🌱 Seeding leaderboard data...');

    // Get existing students
    const students = await db.execute(sql`SELECT id, prenom, nom FROM students LIMIT 10`);
    
    if (!students || !Array.isArray(students[0]) || students[0].length === 0) {
      console.log('⚠️ No students found in database');
      return;
    }

    const studentsArray = Array.isArray(students[0]) ? students[0] : [];
    console.log(`👥 Found ${studentsArray.length} students`);

    // Clear existing data
    await db.execute(sql`DELETE FROM leaderboards`);
    await db.execute(sql`DELETE FROM student_badges`);
    await db.execute(sql`DELETE FROM competitions`);

    // Create sample leaderboard entries
    const studentsArray = Array.isArray(students[0]) ? students[0] : [];
    const leaderboardData = studentsArray.map((student: any, index: number) => {
      if (!student || !student.id) return null;
      
      const score = Math.floor(Math.random() * 1000) + 500; // 500-1500 points
      const rank = index + 1;
      
      return {
        student_id: student.id,
        student_name: `${student.prenom ?? ''} ${student.nom ?? ''}`,
        score,
        rank
      };
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Sort by score descending
    leaderboardData.sort((a, b) => b.score - a.score);
    
    // Update ranks after sorting
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Insert leaderboard entries one by one
    for (const entry of leaderboardData) {
      if (!entry || !entry.student_id) continue;
      
      await db.execute(sql`
        INSERT INTO leaderboards 
        (type, category, student_id, score, \`rank\`, period, metadata, created_at) 
        VALUES 
        ('global', 'points', ${entry.student_id}, ${entry.score ?? 0}, ${entry.rank ?? 0}, 
         'all-time', JSON_OBJECT('name', ${entry.student_name ?? ''}), NOW())
      `);
    }

    // Create competitions
    await db.execute(sql`
      INSERT INTO competitions 
      (id, name, description, type, start_date, end_date, participants, rewards, active) 
      VALUES 
      (1, '🚀 Défi de la Semaine', 'Complétez 20 exercices cette semaine !', 
       'weekly_challenge', NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 5 DAY, 
       ${Math.floor(studentsArray.length * 0.6)}, JSON_ARRAY('🏆 Badge Spécial', '💎 100 Points Bonus'), true),
       
      (2, '⚡ Marathon Mathématique', 'Résolvez un maximum d\\'exercices de maths !', 
       'monthly_competition', NOW() - INTERVAL 10 DAY, NOW() + INTERVAL 20 DAY,
       ${Math.floor(studentsArray.length * 0.8)}, JSON_ARRAY('👑 Couronne Dorée', '🎁 Surprise Spéciale'), true)
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
      if (!student || !student.student_id) continue;
      
      const badge = badgeTypes[Math.min(i, badgeTypes.length - 1)];
      
      await db.execute(sql`
        INSERT INTO student_badges 
        (student_id, badge_type, title, description, rarity, metadata, earned_at) 
        VALUES 
        (${student.student_id}, ${badge.type}, ${badge.title}, ${badge.description}, 
         ${badge.rarity}, JSON_OBJECT('rank', ${student.rank ?? 0}, 'score', ${student.score ?? 0}), NOW())
      `);
    }

    console.log(`✅ Seeded leaderboard with ${leaderboardData.length} entries`);
    console.log(`🏅 Awarded ${topStudents.length} badges`);
    console.log(`🎮 Created 2 competitions`);
    console.log('🎉 Leaderboard seeding completed!');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Seeding failed:', errorMessage);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(errorMessage);
  }
}

// Run seeding
if (require.main === module) {
  seedLeaderboards()
    .then(() => {
      console.log('🎯 All done!');
      process.exit(0);
    })
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Seeding failed:', errorMessage);
      process.exit(1);
    });
}

export { seedLeaderboards };