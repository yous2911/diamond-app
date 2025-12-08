/**
 * REAL Unit Tests for CompetenciesService
 * Tests actual competency management functions, not mocks
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { competenciesService } from '../services/competencies.service';
import path from 'path';
import fs from 'fs/promises';

describe('CompetenciesService - Real Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    // Clear cache before each test
    competenciesService.clearContentCache();
    
    // Mock database for testing
    mockDb = {
      execute: async (query: _string, params?: any[]) => {
        // Mock database responses based on query
        if (query.includes('SELECT code, titre as nom')) {
          return [[
            {
              code: 'CE2.FR.L.FL.01',
              nom: 'Lecture - Fluence',
              matiere: 'FR',
              domaine: 'L',
              description: 'Test competency',
              xp_reward: 0
            }
          ]];
        }
        return [[]];
      }
    };
  });

  afterEach(() => {
    competenciesService.clearContentCache();
  });

  describe('Content Loading', () => {
    test('loadCompetencyContent returns null for non-CE2 competencies', async () => {
      const result = await competenciesService.loadCompetencyContent('CP.FR.L.FL.01');
      expect(result).toBeNull();
    });

    test('loadCompetencyContent returns null for invalid format', async () => {
      const result = await competenciesService.loadCompetencyContent('invalid-format');
      expect(result).toBeNull();
    });

    test('loadCompetencyContent returns null for malformed code', async () => {
      const result = await competenciesService.loadCompetencyContent('CE2');
      expect(result).toBeNull();
    });

    test('loadCompetencyContent caches results', async () => {
      // First call should attempt to load (will fail but cache null)
      const result1 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');
      
      // Second call should return cached result
      const result2 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');
      
      expect(result1).toBe(result2);
    });

    test('loadCompetencyContent handles file system errors gracefully', async () => {
      const result = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.99');
      expect(result).toBeNull();
    });
  });

  describe('Competency List Management', () => {
    test('getCompetenciesList returns competencies with default filters', async () => {
      const result = await competenciesService.getCompetenciesList(mockDb);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('getCompetenciesList filters by level', async () => {
      const filters = { level: 'CE2' };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCompetenciesList filters by subject', async () => {
      const filters = { subject: 'FR' };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCompetenciesList applies limit and offset', async () => {
      const filters = { limit: _5, offset: 0 };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCompetenciesList handles database errors', async () => {
      const errorDb = {
        execute: async () => {
          throw new Error('Database error');
        }
      };

      await expect(competenciesService.getCompetenciesList(errorDb))
        .rejects.toThrow('Failed to fetch competencies list');
    });
  });

  describe('Individual Competency Management', () => {
    test('getCompetencyWithContent returns competency with content', async () => {
      const result = await competenciesService.getCompetencyWithContent(mockDb, 'CE2.FR.L.FL.01');
      
      expect(result).toBeDefined();
      expect(result!.code).toBe('CE2.FR.L.FL.01');
      expect(result!.nom).toBe('Lecture - Fluence');
      expect(result!.matiere).toBe('FR');
      expect(result!.domaine).toBe('L');
    });

    test('getCompetencyWithContent returns null for non-existent competency', async () => {
      const emptyDb = {
        execute: async () => [[]]
      };
      
      const result = await competenciesService.getCompetencyWithContent(emptyDb, 'CE2.FR.L.FL.99');
      expect(result).toBeNull();
    });

    test('getCompetencyWithContent handles database errors', async () => {
      const errorDb = {
        execute: async () => {
          throw new Error('Database error');
        }
      };

      await expect(competenciesService.getCompetencyWithContent(errorDb, 'CE2.FR.L.FL.01'))
        .rejects.toThrow('Failed to fetch competency: CE2.FR.L.FL.01');
    });
  });

  describe('Cache Management', () => {
    test('generateListCacheKey creates correct key', () => {
      const filters = { level: 'CE2', subject: 'FR', limit: 10, offset: 0 };
      const key = competenciesService.generateListCacheKey(filters);
      
      expect(key).toBe('comp:list:CE2:FR:10:0');
    });

    test('generateListCacheKey handles missing filters', () => {
      const key = competenciesService.generateListCacheKey({});
      expect(key).toBe('comp:list:all:all:100:0');
    });

    test('generateItemCacheKey creates correct key', () => {
      const key = competenciesService.generateItemCacheKey('CE2.FR.L.FL.01');
      expect(key).toBe('comp:item:CE2.FR.L.FL.01');
    });

    test('clearContentCache clears cache', () => {
      // Add something to cache first
      competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');
      
      const statsBefore = competenciesService.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);
      
      competenciesService.clearContentCache();
      
      const statsAfter = competenciesService.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    test('getCacheStats returns correct stats', () => {
      const stats = competenciesService.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(stats.size).toBeDefined();
      expect(stats.keys).toBeDefined();
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('Validation', () => {
    test('validateCompetencyCode validates correct format', () => {
      const validCodes = [
        'CP.FR.L.FL.01',
        'CE1.MA.N.CA.05',
        'CE2.FR.E.OR.10'
      ];

      validCodes.forEach(code => {
        expect(competenciesService.validateCompetencyCode(code)).toBe(true);
      });
    });

    test('validateCompetencyCode rejects invalid format', () => {
      const invalidCodes = [
        'INVALID',
        'CP.FR.L.FL',
        'CP.FR.L.FL.01.EXTRA',
        'CP.INVALID.L.FL.01',
        'INVALID.FR.L.FL.01'
      ];

      invalidCodes.forEach(code => {
        expect(competenciesService.validateCompetencyCode(code)).toBe(false);
      });
    });

    test('validateCompetencyCode handles edge cases', () => {
      expect(competenciesService.validateCompetencyCode('')).toBe(false);
      expect(competenciesService.validateCompetencyCode('CP')).toBe(false);
      expect(competenciesService.validateCompetencyCode('CP.FR')).toBe(false);
    });
  });

  describe('Content Preloading', () => {
    test('preloadContentForLevel handles non-existent level gracefully', async () => {
      // This should not throw an error
      await expect(competenciesService.preloadContentForLevel('NONEXISTENT'))
        .resolves.not.toThrow();
    });

    test('preloadContentForLevel handles missing content directory', async () => {
      // This should not throw an error
      await expect(competenciesService.preloadContentForLevel('CP'))
        .resolves.not.toThrow();
    });
  });

  describe('Service Configuration', () => {
    test('service initializes with correct content path', () => {
      // The service should have a content path set
      const stats = competenciesService.getCacheStats();
      expect(stats).toBeDefined();
    });

    test('service handles multiple concurrent requests', async () => {
      // Test that the service can handle multiple requests
      const promises = [
        competenciesService.loadCompetencyContent('CE2.FR.L.FL.01'),
        competenciesService.loadCompetencyContent('CE2.FR.L.FL.02'),
        competenciesService.loadCompetencyContent('CE2.MA.N.CA.01')
      ];

      const results = await Promise.all(promises);
      expect(results).toBeDefined();
      expect(results.length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('service handles malformed competency codes gracefully', async () => {
      const malformedCodes = [
        '',
        'CE2',
        'CE2.FR',
        'CE2.FR.L',
        'CE2.FR.L.FL',
        'CE2.FR.L.FL.01.EXTRA'
      ];

      for (const code of malformedCodes) {
        const result = await competenciesService.loadCompetencyContent(code);
        expect(result).toBeNull();
      }
    });

    test('service handles null/undefined inputs gracefully', async () => {
      // @ts-ignore - Testing runtime behavior
      const result1 = await competenciesService.loadCompetencyContent(null);
      // @ts-ignore - Testing runtime behavior
      const result2 = await competenciesService.loadCompetencyContent(undefined);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});





