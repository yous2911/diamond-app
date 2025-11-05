-- CRITICAL DATABASE PERFORMANCE INDEXES
-- Production-ready indexes for optimal query performance

-- =================
-- AUTHENTICATION & SECURITY INDEXES
-- =================

-- Students table (primary authentication table)
CREATE INDEX IF NOT EXISTS idx_students_email_unique ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_email_hash ON students USING hash(email); -- For exact email lookups
CREATE INDEX IF NOT EXISTS idx_students_active_status ON students(active, email); -- For active user queries
CREATE INDEX IF NOT EXISTS idx_students_role_status ON students(role, active); -- For role-based queries
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at); -- For registration analytics
CREATE INDEX IF NOT EXISTS idx_students_last_login ON students(last_login); -- For user activity tracking

-- Password reset tokens (critical for security)
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_tokens USING hash(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at, used);
CREATE INDEX IF NOT EXISTS idx_password_reset_cleanup ON password_reset_tokens(expires_at) WHERE used = false;

-- Session management (if using session storage)
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON user_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions USING hash(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at, active);

-- =================
-- CORE EDUCATIONAL DATA INDEXES
-- =================

-- Student progress tracking (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_student_progress_student_exercise ON student_progress(student_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_competence ON student_progress(student_id, competence_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_updated ON student_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_progress_score_date ON student_progress(score, completed_at);

-- Exercise attempts (high-volume table)
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_student_id ON exercise_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_student_exercise_date ON exercise_attempts(student_id, exercise_id, attempted_at);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_score ON exercise_attempts(score, attempted_at);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_completion ON exercise_attempts(completed_at) WHERE completed_at IS NOT NULL;

-- Competences mapping (for curriculum queries)
CREATE INDEX IF NOT EXISTS idx_competences_niveau_matiere ON competences(niveau, matiere);
CREATE INDEX IF NOT EXISTS idx_competences_code_hash ON competences USING hash(code);
CREATE INDEX IF NOT EXISTS idx_competences_periode_active ON competences(periode, active);

-- Exercises filtering and search
CREATE INDEX IF NOT EXISTS idx_exercises_niveau_matiere_type ON exercises(niveau, matiere, type);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulte_active ON exercises(difficulte, active);
CREATE INDEX IF NOT EXISTS idx_exercises_competence_id ON exercises(competence_id);
CREATE INDEX IF NOT EXISTS idx_exercises_full_text ON exercises USING gin(to_tsvector('french', titre || ' ' || consigne));

-- =================
-- CP2025 CURRICULUM INDEXES (Enhanced)
-- =================

-- Modules performance optimization
CREATE INDEX IF NOT EXISTS idx_cp2025_modules_niveau_matiere_periode ON cp2025_modules(niveau, matiere, periode);
CREATE INDEX IF NOT EXISTS idx_cp2025_modules_competence_active ON cp2025_modules(competence_domain, cp2025);
CREATE INDEX IF NOT EXISTS idx_cp2025_modules_ordre ON cp2025_modules(ordre, niveau);

-- Exercises advanced filtering
CREATE INDEX IF NOT EXISTS idx_cp2025_exercises_module_type_difficulty ON cp2025_exercises(module_id, type, difficulte);
CREATE INDEX IF NOT EXISTS idx_cp2025_exercises_competence_type ON cp2025_exercises(competence_code, type);
CREATE INDEX IF NOT EXISTS idx_cp2025_exercises_search ON cp2025_exercises USING gin(to_tsvector('french', titre || ' ' || consigne));

-- Exercise configurations (JSONB optimization)
CREATE INDEX IF NOT EXISTS idx_cp2025_configurations_type ON cp2025_exercise_configurations(configuration_type);
CREATE INDEX IF NOT EXISTS idx_cp2025_configurations_data_gin ON cp2025_exercise_configurations USING gin(configuration_data);

-- =================
-- ANALYTICS & REPORTING INDEXES
-- =================

-- Student analytics (for dashboards)
CREATE INDEX IF NOT EXISTS idx_analytics_student_date_range ON student_progress(student_id, completed_at)
    WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days';

-- Exercise analytics (for content optimization)
CREATE INDEX IF NOT EXISTS idx_analytics_exercise_performance ON exercise_attempts(exercise_id, score, attempted_at)
    WHERE attempted_at >= CURRENT_DATE - INTERVAL '7 days';

-- Competence mastery tracking
CREATE INDEX IF NOT EXISTS idx_competence_mastery ON student_progress(competence_id, score, completed_at)
    WHERE score >= 80;

-- =================
-- GDPR & AUDIT INDEXES
-- =================

-- Audit trail (for compliance)
CREATE INDEX IF NOT EXISTS idx_audit_trail_student_action ON audit_trail(student_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_date ON audit_trail(table_name, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_data_gin ON audit_trail USING gin(data_changes);

-- Data export optimization
CREATE INDEX IF NOT EXISTS idx_gdpr_exports_student ON gdpr_data_exports(student_id, status);
CREATE INDEX IF NOT EXISTS idx_gdpr_exports_created ON gdpr_data_exports(created_at, status);

-- =================
-- SYSTEM PERFORMANCE INDEXES
-- =================

-- Monitoring and health checks
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON system_logs(level, timestamp)
    WHERE level IN ('ERROR', 'WARN');

-- Cache management (if using database-backed cache)
CREATE INDEX IF NOT EXISTS idx_cache_entries_key_expires ON cache_entries(cache_key, expires_at)
    WHERE expires_at > NOW();

-- =================
-- PARTIAL INDEXES FOR EFFICIENCY
-- =================

-- Only index active students for most queries
CREATE INDEX IF NOT EXISTS idx_students_active_only ON students(email, role) WHERE active = true;

-- Only index recent attempts for performance queries
CREATE INDEX IF NOT EXISTS idx_recent_attempts ON exercise_attempts(student_id, exercise_id, score)
    WHERE attempted_at >= CURRENT_DATE - INTERVAL '30 days';

-- Only index incomplete progress for recommendation engine
CREATE INDEX IF NOT EXISTS idx_incomplete_progress ON student_progress(student_id, competence_id)
    WHERE score < 80 OR completed_at IS NULL;

-- =================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =================

-- Student dashboard query optimization
CREATE INDEX IF NOT EXISTS idx_student_dashboard ON student_progress(student_id, competence_id, score, completed_at);

-- Curriculum progression tracking
CREATE INDEX IF NOT EXISTS idx_curriculum_progression ON exercises(niveau, matiere, competence_id, difficulte);

-- Exercise recommendation engine
CREATE INDEX IF NOT EXISTS idx_exercise_recommendations ON exercises(competence_id, difficulte, type, active);

-- =================
-- STATISTICS UPDATE
-- =================

-- Ensure PostgreSQL has up-to-date statistics for query planning
ANALYZE students;
ANALYZE student_progress;
ANALYZE exercise_attempts;
ANALYZE exercises;
ANALYZE competences;
ANALYZE cp2025_modules;
ANALYZE cp2025_exercises;
ANALYZE cp2025_exercise_configurations;

-- Update statistics for the query planner
UPDATE pg_stat_user_tables SET n_tup_upd = n_tup_upd + 1 WHERE schemaname = 'public';

-- =================
-- INDEX MONITORING QUERY
-- =================

-- Query to monitor index usage (run periodically)
/*
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/