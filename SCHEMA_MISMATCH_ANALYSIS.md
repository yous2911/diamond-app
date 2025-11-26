# Schema vs Migration Files - Mismatch Analysis

## Critical Issues Found

### 1. **001_setup_mysql_cp2025.sql** - COMPLETELY DIFFERENT STRUCTURE

**Students Table Mismatch:**
- ❌ Migration uses: `identifiant`, `mot_de_passe`, `classe`, `niveau`, `age_group`, `date_inscription`, `last_login`, `total_xp`, `current_level`, `current_streak`, `hearts_remaining`, `is_active`
- ✅ Schema.ts uses: `prenom`, `nom`, `email`, `passwordHash`, `dateNaissance`, `niveauActuel`, `totalPoints`, `xp`, `serieJours`, `mascotteType`, `dernierAcces`, `estConnecte`, `failedLoginAttempts`, `lockedUntil`, `passwordResetToken`, `passwordResetExpires`, `niveauScolaire`, `mascotteColor`

**Exercises Table Mismatch:**
- ❌ Migration uses: `competence_id` (INT, foreign key to `competences_cp`)
- ✅ Schema.ts uses: `competenceCode` (VARCHAR(20))

**Missing Tables in Migration:**
- `student_learning_path` (exists in schema.ts)
- `sessions` (exists in schema.ts)
- `revisions` (exists in schema.ts)
- `modules` (exists in schema.ts)

**Extra Tables in Migration (not in schema.ts):**
- `competences_cp` (not in schema.ts)
- `learning_sessions` (different from `sessions`)
- `exercise_results` (not in schema.ts)
- `mascots` (not in schema.ts)
- `wardrobe_items` (not in schema.ts)
- `student_wardrobe` (not in schema.ts)
- `achievements` (different structure)
- `student_stats` (not in schema.ts)

### 2. **add-gdpr-tables.sql** - WRONG DATABASE SYNTAX

**Critical Error: Uses SQLite syntax instead of MySQL**
- ❌ `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite)
- ✅ Should be: `INT PRIMARY KEY AUTO_INCREMENT` (MySQL)
- ❌ `TEXT` (SQLite)
- ✅ Should be: `VARCHAR` or `TEXT` (MySQL)
- ❌ `datetime('now')` (SQLite)
- ✅ Should be: `NOW()` or `CURRENT_TIMESTAMP` (MySQL)

**Files Table Mismatch:**
- Migration: `filename`, `original_name`, `mimetype`, `size`, `path`, `uploaded_at`, `is_gdpr_protected`, `retention_date`, `metadata`
- Schema.ts: `id` (VARCHAR(36)), `studentId`, `fileName`, `filePath`, `fileSize`, `mimeType`, `uploadedAt`, `uploadedBy`, `status`, `category`, `isPublic`, `checksum`, `url`, `thumbnailUrl`, `metadata`

### 3. **add-file-upload-tables.sql** - WRONG DATABASE SYNTAX

**Critical Error: Uses SQLite syntax instead of MySQL**
- Same issues as above (SQLite vs MySQL syntax)

**Table Structure Mismatch:**
- Migration uses: `file_id`, `type`, `filename`, `path`, `url`, `size`, `mimetype`
- Schema.ts uses: `originalFileId`, `variantType`, `filePath`, `fileSize`, `url`, `metadata`

### 4. **002_gamification_system.sql** - TABLE NAME MISMATCHES

**Table Name Mismatches:**
- ❌ Migration: `user_achievements` (references `user_id`)
- ✅ Schema.ts: `student_achievements` (references `student_id`)
- ❌ Migration: `user_streaks` (references `user_id`)
- ✅ Schema.ts: `streaks` (references `student_id`)

**Column Mismatches in Achievements:**
- Migration: `user_id`, `achievement_id`, `earned_at`, `metadata`
- Schema.ts: `studentId`, `achievementCode`, `badgeIcon`, `achievementType`, `title`, `description`, `xpReward`, `unlockedAt`

**Missing Tables in Migration:**
- `daily_goals` (exists in schema.ts)
- `spaced_repetition` (exists in schema.ts)
- `push_notifications` (exists in schema.ts)
- `daily_learning_analytics` (exists in schema.ts)
- `weekly_progress_summary` (exists in schema.ts)
- `student_competence_progress` (exists in schema.ts)
- `learning_session_tracking` (exists in schema.ts)
- `exercise_performance_analytics` (exists in schema.ts)
- `leaderboard_history` (exists in schema.ts)
- `competitions` (exists in schema.ts)
- `competition_participants` (exists in schema.ts)

### 5. **Missing Parent System Tables**

**Schema.ts has these tables, but NO migration file creates them:**
- `parents` table
- `parent_student_relations` table
- `parental_consent` table (exists in create-fresh-database.sql but not in migrations)

### 6. **Missing GDPR Tables in Migrations**

**Schema.ts has these GDPR tables, but migrations are incomplete:**
- `gdpr_consent_requests` (exists in add-gdpr-tables.sql but wrong syntax)
- `audit_logs` (exists in schema.ts, missing from migrations)
- `gdpr_files` (exists in schema.ts, missing from migrations)
- `gdpr_data_processing_log` (exists in add-gdpr-tables.sql but wrong syntax)
- `gdpr_requests` (exists in schema.ts, missing from migrations)
- `retention_policies` (exists in schema.ts, missing from migrations)
- `retention_schedules` (exists in schema.ts, missing from migrations)
- `consent_preferences` (exists in create-fresh-database.sql but not in migrations)
- `encryption_keys` (exists in schema.ts, missing from migrations)
- `security_alerts` (exists in schema.ts, missing from migrations)
- `compliance_reports` (exists in schema.ts, missing from migrations)

### 7. **Column Name Inconsistencies**

**Snake_case vs camelCase:**
- Migrations use: `student_id`, `exercise_id`, `competence_code`, `created_at`, `updated_at`
- Schema.ts uses: `studentId`, `exerciseId`, `competenceCode`, `createdAt`, `updatedAt`
- **Note:** Drizzle ORM handles this mapping automatically, so this is OK

### 8. **Missing Competence Prerequisites Table**

- Schema.ts has: `competence_prerequisites` table
- Migration `003_add_ce2_competencies.sql` references it but doesn't create it
- `create-fresh-database.sql` creates it correctly

## Summary of Critical Issues

1. **001_setup_mysql_cp2025.sql** is completely incompatible with schema.ts
2. **add-gdpr-tables.sql** uses SQLite syntax (will fail on MySQL)
3. **add-file-upload-tables.sql** uses SQLite syntax (will fail on MySQL)
4. **002_gamification_system.sql** uses wrong table names (`user_*` instead of `student_*`)
5. **Missing parent system tables** in all migration files
6. **Missing many GDPR tables** in migration files
7. **Missing analytics tables** in migration files

## Recommended Actions

1. **Delete or rewrite 001_setup_mysql_cp2025.sql** - It's for a different schema
2. ✅ **FIXED: Convert add-gdpr-tables.sql to MySQL syntax** - DONE
3. ✅ **FIXED: Convert add-file-upload-tables.sql to MySQL syntax** - DONE
4. ✅ **FIXED: Fix 002_gamification_system.sql** - Changed `user_*` to `student_*` - DONE
5. **Create new migration files** for:
   - Parent system tables
   - Missing GDPR tables (audit_logs, gdpr_files, gdpr_requests, retention_policies, etc.)
   - Missing analytics tables
6. **Use create-fresh-database.sql as reference** - It matches schema.ts better

## Fixes Applied

### ✅ Fixed: add-gdpr-tables.sql
- Converted SQLite syntax to MySQL syntax
- Removed `files` table (handled in add-file-upload-tables.sql)
- Fixed `gdpr_consent_requests` to match schema.ts structure
- Fixed `gdpr_data_processing_log` to match schema.ts structure

### ✅ Fixed: add-file-upload-tables.sql
- Converted SQLite syntax to MySQL syntax
- Fixed `files` table to match schema.ts (VARCHAR(36) for id, proper column names)
- Fixed `file_variants` table to match schema.ts
- Removed SQLite-specific triggers and INSERT statements

### ✅ Fixed: 002_gamification_system.sql
- Changed `user_achievements` → `student_achievements` (matches schema.ts)
- Changed `user_streaks` → `streaks` (matches schema.ts)
- Updated all INSERT and SELECT statements to use correct table names
- Fixed column names in views (`mascotteType` → `mascotte_type`, etc.)
- Fixed ALTER TABLE syntax for MySQL compatibility

## Files That Match Schema.ts

✅ **create-fresh-database.sql** - Mostly matches schema.ts (good reference)
✅ **complete_database_creation.sql** - Matches schema.ts structure
✅ **004_add_role_to_students.sql** - Simple ALTER TABLE, looks correct

