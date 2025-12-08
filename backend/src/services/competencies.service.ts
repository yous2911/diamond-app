/**
 * Competencies Service for Educational Platform
 * Provides operations for competency management, content loading, and caching
 */

import path from 'path';
import fs from 'fs/promises';
import { and } from 'drizzle-orm';
// TODO: competences table doesn't exist - competencies are stored in JSON files
// import { competences } from '../db/schema';
// Using console for logging since logger was moved to job-specific logger
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

const __dirname = path.dirname(__filename);

export interface CompetencyContent {
  competency_code: string;
  title: string;
  description: string;
  exercises: any[];
}

export interface CompetencyListFilters {
  level?: string;
  subject?: string;
  limit?: number;
  offset?: number;
}

export interface CachedCompetency {
  code: string;
  nom: string;
  matiere: string;
  domaine: string;
  description: string;
  xp_reward: number;
  content?: CompetencyContent | null;
}

class CompetenciesService {
  private contentCache = new Map<string, CompetencyContent>();
  private contentPath: string;

  constructor() {
    this.contentPath = path.join(__dirname, '../../content');
  }

  /**
   * Load JSON content for a specific competency
   */
  async loadCompetencyContent(competencyCode: string): Promise<CompetencyContent | null> {
    try {
      // Check cache first
      if (this.contentCache.has(competencyCode)) {
        return this.contentCache.get(competencyCode) || null;
      }

      // Only load content for CE2 competencies for now
      if (!competencyCode.startsWith('CE2.')) {
        return null;
      }

      const parts = competencyCode.split('.');
      if (parts.length < 2) {
        logger.warn(`Invalid competency code format: ${competencyCode}`);
        return null;
      }

      const subject = parts[1]; // FR or MA
      if (!subject) throw new Error('Invalid competency code format');
      const contentFilePath = path.join(this.contentPath, 'CE2', subject, `${competencyCode}.json`);
      
      try {
        const contentData = await fs.readFile(contentFilePath, 'utf8');
        const content = JSON.parse(contentData) as CompetencyContent;
        
        // Cache the content
        this.contentCache.set(competencyCode, content);
        
        return content;
      } catch (fileError: unknown) {
        logger.warn(`Content file not found for ${competencyCode}:`, { err: fileError });
        // Cache null result to avoid repeated file system calls
        this.contentCache.set(competencyCode, null as any);
        return null;
      }
    } catch (error: unknown) {
      logger.error(`Error loading content for ${competencyCode}`, { err: error });
      return null;
    }
  }

  /**
   * Get competencies list from database with optional filtering
   * SECURITY FIX: Uses Drizzle ORM query builder to prevent SQL injection
   */
  async getCompetenciesList(
    db: any,
    filters: CompetencyListFilters = {}
  ): Promise<any[]> {
    // TODO: competences table doesn't exist - competencies are stored in JSON files
    // This function needs to be refactored to load from JSON files instead
    logger.warn('getCompetenciesList: competences table not available, returning empty array');
    return [];
  }

  /**
   * Get a single competency with content
   * SECURITY FIX: Uses Drizzle ORM query builder to prevent SQL injection
   */
  async getCompetencyWithContent(
    db: any,
    competencyCode: string
  ): Promise<CachedCompetency | null> {
    try {
      // Validate competency code format first
      if (!this.validateCompetencyCode(competencyCode)) {
        throw new Error('Invalid competency code format');
      }

      // TODO: competences table doesn't exist - competencies are stored in JSON files
      // This function needs to be refactored to load from JSON files instead
      logger.warn(`getCompetencyWithContent: competences table not available for ${competencyCode}`);
      
      // Try to load content directly from JSON files
      const content = await this.loadCompetencyContent(competencyCode);
      if (!content) {
        return null;
      }

      // Return stub competency based on content
      const baseCompetency = {
        code: competencyCode,
        nom: content.title || competencyCode,
        matiere: competencyCode.split('.')[1] || 'FR',
        domaine: competencyCode.split('.')[2] || '',
        description: content.description || '',
        xp_reward: 0
      };
      
      // Content already loaded above
      return {
        ...baseCompetency,
        content
      } as CachedCompetency;
    } catch (error: unknown) {
      logger.error(`Error fetching competency ${competencyCode}`, { err: error });
      throw new Error(`Failed to fetch competency: ${competencyCode}`);
    }
  }

  /**
   * Generate cache key for competencies list
   */
  generateListCacheKey(filters: CompetencyListFilters): string {
    const { level, subject, limit, offset } = filters;
    return `comp:list:${level || 'all'}:${subject || 'all'}:${limit || 100}:${offset || 0}`;
  }

  /**
   * Generate cache key for individual competency
   */
  generateItemCacheKey(competencyCode: string): string {
    return `comp:item:${competencyCode}`;
  }

  /**
   * Validate competency code format
   */
  validateCompetencyCode(code: string): boolean {
    // Expected format: LEVEL.SUBJECT.DOMAIN.TYPE.NUMBER (e.g., CE2.FR.L.FL.01)
    const parts = code.split('.');
    if (parts.length !== 5) return false;
    
    const [level, subject] = parts;
    const validLevels = ['CP', 'CE1', 'CE2'];
    const validSubjects = ['FR', 'MA'];
    
    return validLevels.includes(level || '') && validSubjects.includes(subject || '');
  }

  /**
   * Clear content cache (useful for testing or cache invalidation)
   */
  clearContentCache(): void {
    this.contentCache.clear();
    logger.info('Competency content cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contentCache.size,
      keys: Array.from(this.contentCache.keys())
    };
  }

  /**
   * Preload content for a level (optimization for startup)
   */
  async preloadContentForLevel(level: string): Promise<void> {
    try {
      logger.info(`Preloading content for level: ${level}`);
      
      const levelPath = path.join(this.contentPath, level);
      
      try {
        await fs.access(levelPath);
      } catch {
        logger.warn(`Content directory not found for level: ${level}`);
        return;
      }

      const subjects = ['FR', 'MA'];
      
      for (const subject of subjects) {
        const subjectPath = path.join(levelPath, subject);
        
        try {
          const files = await fs.readdir(subjectPath);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          for (const file of jsonFiles) {
            const competencyCode = file.replace('.json', '');
            await this.loadCompetencyContent(competencyCode);
          }
          
          logger.info(`Preloaded ${jsonFiles.length} files for ${level}.${subject}`);
        } catch (error: unknown) {
          logger.warn(`Error preloading ${level}.${subject}:`, { err: error });
        }
      }
    } catch (error: unknown) {
      logger.error(`Error preloading content for level ${level}`, { err: error });
    }
  }
}

export const competenciesService = new CompetenciesService();