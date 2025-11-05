-- CRITICAL MYSQL DATABASE PERFORMANCE INDEXES
-- Production-ready indexes for optimal query performance

-- =================
-- AUTHENTICATION & SECURITY INDEXES
-- =================

-- Students table (primary authentication table)
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_email_active ON students(email, active);
CREATE INDEX idx_students_role_active ON students(role, active);
CREATE INDEX idx_students_created_at ON students(created_at);
CREATE INDEX idx_students_last_login ON students(last_login);

-- =================
-- CORE EDUCATIONAL DATA INDEXES
-- =================

-- Student progress tracking (most frequently queried)
CREATE INDEX idx_student_progress_student_exercise ON student_progress(student_id, exercise_id);
CREATE INDEX idx_student_progress_student_competence ON student_progress(student_id, competence_id);
CREATE INDEX idx_student_progress_updated ON student_progress(updated_at DESC);
CREATE INDEX idx_student_progress_score_date ON student_progress(score, completed_at);

-- Exercise attempts (high-volume table)
CREATE INDEX idx_exercise_attempts_student_id ON exercise_attempts(student_id);
CREATE INDEX idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX idx_exercise_attempts_student_exercise_date ON exercise_attempts(student_id, exercise_id, attempted_at);
CREATE INDEX idx_exercise_attempts_score ON exercise_attempts(score, attempted_at);

-- Competences mapping (for curriculum queries)
CREATE INDEX idx_competences_niveau_matiere ON competences(niveau, matiere);
CREATE INDEX idx_competences_code ON competences(code);
CREATE INDEX idx_competences_periode_active ON competences(periode, active);

-- Exercises filtering and search
CREATE INDEX idx_exercises_niveau_matiere_type ON exercises(niveau, matiere, type);
CREATE INDEX idx_exercises_difficulte_active ON exercises(difficulte, active);
CREATE INDEX idx_exercises_competence_id ON exercises(competence_id);

-- =================
-- EXISTING TABLE OPTIMIZATION
-- =================

-- Optimize existing exercises table
CREATE INDEX idx_exercises_niveau ON exercises(niveau);
CREATE INDEX idx_exercises_matiere ON exercises(matiere);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_exercises_difficulte ON exercises(difficulte);
CREATE INDEX idx_exercises_active ON exercises(active);

-- Optimize students table
CREATE INDEX idx_students_nom_prenom ON students(nom, prenom);
CREATE INDEX idx_students_niveau ON students(niveau);

-- =================
-- ANALYTICS & REPORTING INDEXES
-- =================

-- Student analytics (for dashboards)
CREATE INDEX idx_analytics_student_recent ON student_progress(student_id, completed_at);

-- Exercise analytics (for content optimization)
CREATE INDEX idx_analytics_exercise_performance ON exercise_attempts(exercise_id, score, attempted_at);

-- =================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =================

-- Student dashboard query optimization
CREATE INDEX idx_student_dashboard ON student_progress(student_id, competence_id, score, completed_at);

-- Curriculum progression tracking
CREATE INDEX idx_curriculum_progression ON exercises(niveau, matiere, competence_id, difficulte);

-- Exercise recommendation engine
CREATE INDEX idx_exercise_recommendations ON exercises(competence_id, difficulte, type, active);

-- =================
-- FULLTEXT SEARCH INDEXES
-- =================

-- Exercise search functionality
CREATE FULLTEXT INDEX idx_exercises_fulltext ON exercises(titre, consigne);

-- =================
-- CLEAN UP OLD INDEXES (IF ANY CONFLICTS)
-- =================

-- Note: MySQL will automatically skip creating indexes that already exist
-- No need for IF NOT EXISTS syntax in older MySQL versions