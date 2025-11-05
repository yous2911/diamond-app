-- PRODUCTION DATABASE INDEXES - Based on Actual Schema
-- Critical performance indexes for reved_kids database

-- =================
-- STUDENTS TABLE OPTIMIZATION
-- =================

-- Email-based authentication (most critical)
CREATE INDEX idx_students_email_hash ON students(password_hash);
CREATE INDEX idx_students_email_login ON students(email, failed_login_attempts);
CREATE INDEX idx_students_locked_until ON students(locked_until);
CREATE INDEX idx_students_password_reset ON students(password_reset_token, password_reset_expires);

-- Student progression tracking
CREATE INDEX idx_students_niveau_actuel ON students(niveau_actuel);
CREATE INDEX idx_students_niveau_scolaire ON students(niveau_scolaire);
CREATE INDEX idx_students_xp_points ON students(xp, total_points);
CREATE INDEX idx_students_streak ON students(current_streak, serie_jours);

-- Activity monitoring
CREATE INDEX idx_students_dernier_acces ON students(dernier_acces);
CREATE INDEX idx_students_est_connecte ON students(est_connecte, dernier_acces);

-- =================
-- EXERCISES TABLE OPTIMIZATION
-- =================

-- Core curriculum filtering
CREATE INDEX idx_exercises_niveau_matiere ON exercises(niveau, matiere);
CREATE INDEX idx_exercises_competence_niveau ON exercises(competence_id, niveau);
CREATE INDEX idx_exercises_difficulty_niveau ON exercises(difficulty_level, niveau);

-- Exercise discovery and recommendations
CREATE INDEX idx_exercises_matiere_difficulty ON exercises(matiere, difficulty_level);
CREATE INDEX idx_exercises_updated_recent ON exercises(updated_at DESC);

-- Search optimization
CREATE INDEX idx_exercises_titre ON exercises(titre);

-- =================
-- STUDENT PROGRESS OPTIMIZATION
-- =================

-- Student learning analytics
CREATE INDEX idx_student_progress_student_competence ON student_progress(student_id, competence_id);
CREATE INDEX idx_student_progress_student_recent ON student_progress(student_id, created_at DESC);

-- Progress tracking by competence
CREATE INDEX idx_student_progress_competence_date ON student_progress(competence_id, created_at);

-- =================
-- EXERCISE ATTEMPTS OPTIMIZATION
-- =================

-- Student performance tracking
CREATE INDEX idx_exercise_attempts_student_exercise ON exercise_attempts(student_id, exercise_id);
CREATE INDEX idx_exercise_attempts_student_recent ON exercise_attempts(student_id, created_at DESC);

-- Exercise analytics
CREATE INDEX idx_exercise_attempts_exercise_recent ON exercise_attempts(exercise_id, created_at DESC);

-- =================
-- COMPETENCES OPTIMIZATION
-- =================

-- Curriculum structure queries
CREATE INDEX idx_competences_niveau_matiere ON competences(niveau, matiere);
CREATE INDEX idx_competences_code_unique ON competences(code);

-- CP2025 competences
CREATE INDEX idx_competences_cp_code ON competences_cp(code);
CREATE INDEX idx_competences_cp_niveau ON competences_cp(niveau, matiere);

-- =================
-- SECURITY & AUDIT OPTIMIZATION
-- =================

-- Security monitoring
CREATE INDEX idx_security_alerts_student_created ON security_alerts(student_id, created_at);
CREATE INDEX idx_security_alerts_type_date ON security_alerts(alert_type, created_at);

-- Audit trail
CREATE INDEX idx_audit_logs_student_action ON audit_logs(student_id, action);
CREATE INDEX idx_audit_logs_table_date ON audit_logs(table_name, created_at);

-- =================
-- LEARNING PATH OPTIMIZATION
-- =================

-- Personalized learning paths
CREATE INDEX idx_learning_path_student_order ON student_learning_path(student_id, order_in_path);
CREATE INDEX idx_learning_path_student_status ON student_learning_path(student_id, status);

-- =================
-- FILE MANAGEMENT OPTIMIZATION
-- =================

-- File access and security
CREATE INDEX idx_files_student_type ON files(student_id, file_type);
CREATE INDEX idx_files_created_recent ON files(created_at DESC);

-- =================
-- GDPR COMPLIANCE OPTIMIZATION
-- =================

-- Parental consent tracking
CREATE INDEX idx_parental_consent_student_status ON parental_consent(student_id, status);
CREATE INDEX idx_parental_consent_expires ON parental_consent(expires_at);

-- =================
-- COMPOSITE PERFORMANCE INDEXES
-- =================

-- Student dashboard queries (most common)
CREATE INDEX idx_student_dashboard_main ON students(id, niveau_actuel, xp, current_streak);

-- Exercise recommendation engine
CREATE INDEX idx_exercise_recommendations ON exercises(niveau, matiere, difficulty_level, competence_id);

-- Student performance analytics
CREATE INDEX idx_student_performance ON exercise_attempts(student_id, exercise_id, created_at);

-- =================
-- ANALYTICS INDEXES
-- =================

-- Daily active users
CREATE INDEX idx_daily_active_users ON students(dernier_acces, est_connecte);

-- Exercise completion rates
CREATE INDEX idx_exercise_completion ON exercise_attempts(exercise_id, created_at, student_id);

-- Learning progression tracking
CREATE INDEX idx_learning_progression ON student_progress(student_id, competence_id, created_at);