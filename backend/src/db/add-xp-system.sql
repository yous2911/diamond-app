-- Add XP and Level system to students table
ALTER TABLE students 
ADD COLUMN xp INT DEFAULT 0,
ADD COLUMN level INT DEFAULT 1,
ADD COLUMN xp_to_next_level INT DEFAULT 100;

-- Seed students with realistic XP/level data
UPDATE students SET 
  xp = FLOOR(50 + (RAND() * 2000)),  -- Random XP between 50-2050
  level = GREATEST(1, FLOOR(1 + (RAND() * 15))),  -- Random level 1-15
  xp_to_next_level = 100 + (level * 50)  -- Increasing XP requirements per level
WHERE xp = 0;

-- Seed leaderboard data with your 23 students
INSERT INTO leaderboards (type, category, student_id, score, `rank`, period, class_id, created_at)
SELECT 
  'global' as type,
  'points' as category,
  s.id as student_id,
  s.xp as score,
  ROW_NUMBER() OVER (ORDER BY s.xp DESC) as `rank`,
  'all_time' as period,
  COALESCE(s.class_id, 1) as class_id,
  NOW() as created_at
FROM students s;

-- Add weekly leaderboard entries
INSERT INTO leaderboards (type, category, student_id, score, `rank`, period, class_id, created_at)
SELECT 
  'weekly' as type,
  'points' as category,
  s.id as student_id,
  FLOOR(s.xp * 0.3) as score,  -- 30% of total XP for this week
  ROW_NUMBER() OVER (ORDER BY s.xp DESC) as `rank`,
  'week' as period,
  COALESCE(s.class_id, 1) as class_id,
  NOW() as created_at
FROM students s;

-- Add monthly leaderboard entries  
INSERT INTO leaderboards (type, category, student_id, score, `rank`, period, class_id, created_at)
SELECT 
  'monthly' as type,
  'points' as category,
  s.id as student_id,
  FLOOR(s.xp * 0.7) as score,  -- 70% of total XP for this month
  ROW_NUMBER() OVER (ORDER BY s.xp DESC) as `rank`,
  'month' as period,
  COALESCE(s.class_id, 1) as class_id,
  NOW() as created_at
FROM students s;

-- Create sample competitions
INSERT INTO competitions (name, type, start_date, end_date, status, created_at) VALUES
('Math Masters Challenge', 'math', '2024-01-01', '2024-12-31', 'active', NOW()),
('Reading Champions', 'reading', '2024-01-01', '2024-12-31', 'active', NOW()),
('Science Explorers', 'science', '2024-01-01', '2024-12-31', 'active', NOW());

-- Create student badges (random achievements)
INSERT INTO student_badges (student_id, badge_name, badge_type, earned_date, description, metadata)
SELECT 
  s.id,
  CASE 
    WHEN RAND() < 0.3 THEN 'Math Wizard'
    WHEN RAND() < 0.5 THEN 'Reading Star' 
    WHEN RAND() < 0.7 THEN 'Science Explorer'
    WHEN RAND() < 0.9 THEN 'Problem Solver'
    ELSE 'Quick Learner'
  END as badge_name,
  'achievement' as badge_type,
  NOW() as earned_date,
  'Earned for excellent performance' as description,
  JSON_OBJECT('level', FLOOR(1 + RAND() * 5), 'category', 'learning') as metadata
FROM students s
ORDER BY RAND()
LIMIT FLOOR((SELECT COUNT(*) FROM students) * 2.5);  -- Each student gets ~2.5 badges on average