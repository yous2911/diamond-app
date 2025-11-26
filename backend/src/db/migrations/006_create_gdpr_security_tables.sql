-- =============================================================================
-- GDPR & Security Tables Migration
-- Creates missing GDPR compliance and security tables
-- Required by: data-archiving.service.ts, GDPR services
-- =============================================================================

-- Audit Logs table (matches schema.ts)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id VARCHAR(36),
  parent_id VARCHAR(36),
  student_id VARCHAR(36),
  details JSON NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  category VARCHAR(50),
  session_id VARCHAR(100),
  correlation_id VARCHAR(36),
  checksum VARCHAR(64) NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_student (student_id),
  INDEX idx_audit_logs_parent (parent_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_timestamp (timestamp),
  INDEX idx_audit_logs_severity (severity),
  INDEX idx_audit_logs_category (category)
);

-- GDPR Files table (matches schema.ts) - Different from files table
CREATE TABLE IF NOT EXISTS gdpr_files (
  id VARCHAR(36) PRIMARY KEY,
  student_id INT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64),
  encrypted BOOLEAN DEFAULT false,
  retention_date TIMESTAMP NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  
  INDEX idx_gdpr_files_student_id (student_id),
  INDEX idx_gdpr_files_status (status),
  INDEX idx_gdpr_files_retention (retention_date),
  INDEX idx_gdpr_files_created (created_at)
);

-- GDPR Requests table (matches schema.ts)
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  request_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  
  INDEX idx_gdpr_requests_student (student_id),
  INDEX idx_gdpr_requests_type (request_type),
  INDEX idx_gdpr_requests_status (status)
);

-- Retention Policies table (matches schema.ts)
CREATE TABLE IF NOT EXISTS retention_policies (
  id VARCHAR(36) PRIMARY KEY,
  policy_name VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  retention_period_days INT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_retention_policies_entity (entity_type),
  INDEX idx_retention_policies_active (active)
);

-- Retention Schedules table (matches schema.ts)
CREATE TABLE IF NOT EXISTS retention_schedules (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_retention_schedules_entity (entity_type, entity_id),
  INDEX idx_retention_schedules_scheduled (scheduled_date),
  INDEX idx_retention_schedules_action (action)
);

-- Encryption Keys table (matches schema.ts)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_type VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_encryption_keys_type (key_type),
  INDEX idx_encryption_keys_active (is_active)
);

-- Security Alerts table (matches schema.ts)
CREATE TABLE IF NOT EXISTS security_alerts (
  id VARCHAR(36) PRIMARY KEY,
  student_id INT,
  type VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  
  INDEX idx_security_alerts_student (student_id),
  INDEX idx_security_alerts_type (type),
  INDEX idx_security_alerts_severity (severity),
  INDEX idx_security_alerts_resolved (is_resolved),
  INDEX idx_security_alerts_created (created_at)
);

-- Compliance Reports table (matches schema.ts)
CREATE TABLE IF NOT EXISTS compliance_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  data JSON,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_compliance_reports_type (report_type),
  INDEX idx_compliance_reports_status (status),
  INDEX idx_compliance_reports_generated (generated_at)
);

