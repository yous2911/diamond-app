import { db } from './connection';
import { config } from '../config/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';

// Migration interface
interface Migration {
  id: string;
  checksum: string;
  filename: string;
  appliedAt?: Date;
  up: string;
  down?: string;
}

export class MySQLMigrationManager {
  private migrationsPath: string;

  constructor(migrationsPath: string = './migrations') {
    this.migrationsPath = migrationsPath;
  }

  // Initialize migrations table
  async initialize(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS __migrations__ (
          id VARCHAR(255) PRIMARY KEY,
          checksum VARCHAR(64) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Migrations table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migrations table:', error);
      throw error;
    }
  }

  // Load migration files from filesystem
  loadMigrationFiles(): Migration[] {
    const migrations: Migration[] = [];

    if (!fs.existsSync(this.migrationsPath)) {
      console.log('⚠️  No migrations directory found');
      return migrations;
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const id = file.replace('.sql', '');
      
      migrations.push({
        id,
        checksum: crypto.createHash('md5').update(content).digest('hex'),
        filename: file,
        up: content
      });
    }

    return migrations;
  }

  // Get applied migrations from database
  async getAppliedMigrations(): Promise<Migration[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, checksum, filename, applied_at
        FROM __migrations__
        ORDER BY id
      `);
      
      return (result as any[]).map((row: any) => ({
        id: row.id,
        checksum: row.checksum,
        filename: row.filename,
        appliedAt: row.applied_at,
        up: '' // Required by interface but not used for applied migrations
      }));
    } catch (error) {
      console.error('❌ Failed to get applied migrations:', error);
      return [];
    }
  }

  // Apply a single migration
  async applyMigration(migration: Migration): Promise<void> {
    try {
      console.log(`📄 Applying migration: ${migration.filename}`);
      
      // Execute migration SQL
      await db.execute(sql.raw(migration.up));
      
      // Record migration as applied
      await db.execute(sql`
        INSERT INTO __migrations__ (id, checksum, filename, applied_at)
        VALUES (${migration.id}, ${migration.checksum}, ${migration.filename}, NOW())
      `);
      
      console.log(`✅ Applied migration: ${migration.filename}`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration.filename}:`, error);
      throw error;
    }
  }

  // Run pending migrations
  async runPendingMigrations(): Promise<void> {
    try {
      await this.initialize();
      
      const fileMigrations = this.loadMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      const appliedIds = new Set(appliedMigrations.map(m => m.id));
      const pendingMigrations = fileMigrations.filter(m => !appliedIds.has(m.id));
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log('🎉 All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Check migration status
  async status(): Promise<void> {
    try {
      await this.initialize();
      
      const fileMigrations = this.loadMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      console.log('\n📊 Migration Status:');
      console.log('=' .repeat(60));
      
      if (fileMigrations.length === 0) {
        console.log('No migration files found');
        return;
      }

      const appliedIds = new Set(appliedMigrations.map(m => m.id));
      
      for (const migration of fileMigrations) {
        const isApplied = appliedIds.has(migration.id);
        const status = isApplied ? '✅ Applied' : '⏳ Pending';
        const appliedDate = appliedMigrations.find(m => m.id === migration.id)?.appliedAt;
        
        console.log(`${status} ${migration.filename} ${appliedDate ? `(${appliedDate})` : ''}`);
      }
      
      const pendingCount = fileMigrations.filter(m => !appliedIds.has(m.id)).length;
      console.log(`\n📈 Total: ${fileMigrations.length} migrations, ${pendingCount} pending`);
      
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  // Use Drizzle migrations if available
  async runDrizzleMigrations(): Promise<void> {
    try {
      console.log('🔄 Running Drizzle migrations...');
      
      // Use the correct migrator for MySQL
      const { migrate } = await import('drizzle-orm/mysql2/migrator');
      await migrate(db, { 
        migrationsFolder: './drizzle',
        migrationsTable: '__drizzle_migrations__',
      });
      
      console.log('✅ Drizzle migrations completed');
    } catch (error) {
      console.error('❌ Drizzle migration failed:', error);
      throw error;
    }
  }

  // Show database info
  async showDatabaseInfo(): Promise<void> {
    try {
      console.log('\n🗄️  Database Information:');
      console.log('=' .repeat(50));
      console.log(`📍 Database: MySQL (${config.DB_NAME})`);
      
      // Get table count
      const tables = await db.execute(sql`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ${config.DB_NAME}
        AND TABLE_TYPE = 'BASE TABLE'
      `);
      
      console.log(`📊 Tables: ${(tables as any[]).length}`);
      
      for (const table of tables as any[]) {
        console.log(`  - ${table.TABLE_NAME}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to get database info:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'status';
  const manager = new MySQLMigrationManager();

  try {
    switch (command) {
      case 'up':
        await manager.runPendingMigrations();
        break;
        
      case 'status':
        await manager.status();
        break;
        
      case 'info':
        await manager.showDatabaseInfo();
        break;
        
      case 'drizzle':
        await manager.runDrizzleMigrations();
        break;
        
      default:
        console.log('Usage: tsx migrate.ts [up|status|info|drizzle]');
        console.log('  up      - Run pending migrations');
        console.log('  status  - Show migration status');
        console.log('  info    - Show database information');
        console.log('  drizzle - Run Drizzle migrations');
        break;
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { main as runMigrations };

// Run CLI if called directly
if (require.main === module) {
  main();
}