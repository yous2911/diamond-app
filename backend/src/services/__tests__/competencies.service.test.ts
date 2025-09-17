/**
 * Unit tests for CompetenciesService
 * Tests competency management, content loading, caching, and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { competenciesService, CompetencyContent, CompetencyListFilters } from '../competencies.service';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn()
  },
  readFile: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn()
}));

// Mock console for logger
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true
});

describe('CompetenciesService', () => {
  const mockDb = {
    execute: vi.fn()
  };

  const mockCompetencyContent: CompetencyContent = {
    competency_code: 'CE2.FR.L.FL.01',
    title: 'Identifier les mots de manière fluide',
    description: 'Objectif 90 mots/minute, voie directe majoritaire',
    exercises: [
      {
        id: 1,
        type: 'reading',
        content: 'Test exercise content'
      }
    ]
  };

  const mockCompetencyRow = {
    code: 'CE2.FR.L.FL.01',
    nom: 'Identifier les mots de manière fluide',
    matiere: 'FR',
    domaine: 'L',
    description: 'Objectif 90 mots/minute, voie directe majoritaire',
    xp_reward: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    competenciesService.clearContentCache();
  });

  afterEach(() => {
    competenciesService.clearContentCache();
  });

  describe('loadCompetencyContent', () => {
    it('should load content for CE2 competency', async () => {
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockCompetencyContent));

      const result = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');

      expect(result).toEqual(mockCompetencyContent);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('CE2/FR/CE2.FR.L.FL.01.json'),
        'utf8'
      );
    });

    it('should return cached content on second call', async () => {
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockCompetencyContent));

      // First call
      const result1 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');
      // Second call
      const result2 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');

      expect(result1).toEqual(mockCompetencyContent);
      expect(result2).toEqual(mockCompetencyContent);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-CE2 competencies', async () => {
      const result = await competenciesService.loadCompetencyContent('CE1.FR.L.FL.01');
      expect(result).toBeNull();
    });

    it('should return null for invalid competency code format', async () => {
      const result = await competenciesService.loadCompetencyContent('INVALID');
      expect(result).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Invalid competency code format: INVALID'
      );
    });

    it('should handle file not found errors', async () => {
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      const fileError = new Error('ENOENT: no such file or directory');
      fileError.message = 'File not found';
      mockReadFile.mockRejectedValueOnce(fileError);

      const result = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.99');

      expect(result).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Content file not found for CE2.FR.L.FL.99:',
        'File not found'
      );
    });

    it('should handle JSON parsing errors', async () => {
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce('invalid json');

      const result = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');

      expect(result).toBeNull();
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error loading content for CE2.FR.L.FL.01:',
        expect.any(Error)
      );
    });

    it('should cache null results to avoid repeated file system calls', async () => {
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      const fileError = new Error('File not found');
      mockReadFile.mockRejectedValueOnce(fileError);

      // First call
      const result1 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.99');
      // Second call
      const result2 = await competenciesService.loadCompetencyContent('CE2.FR.L.FL.99');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCompetenciesList', () => {
    const mockRows = [mockCompetencyRow];

    it('should fetch competencies with no filters', async () => {
      mockDb.execute.mockResolvedValueOnce([mockRows]);

      const result = await competenciesService.getCompetenciesList(mockDb);

      expect(result).toEqual(mockRows);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE est_actif = 1')
      );
    });

    it('should filter by level', async () => {
      mockDb.execute.mockResolvedValueOnce([mockRows]);

      const filters: CompetencyListFilters = { level: 'CE2' };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);

      expect(result).toEqual(mockRows);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("code LIKE 'CE2.%'")
      );
    });

    it('should filter by subject', async () => {
      mockDb.execute.mockResolvedValueOnce([mockRows]);

      const filters: CompetencyListFilters = { subject: 'FR' };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);

      expect(result).toEqual(mockRows);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("matiere = 'FR'")
      );
    });

    it('should apply limit and offset', async () => {
      mockDb.execute.mockResolvedValueOnce([mockRows]);

      const filters: CompetencyListFilters = { limit: 10, offset: 5 };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);

      expect(result).toEqual(mockRows);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10 OFFSET 5')
      );
    });

    it('should filter by level and subject together', async () => {
      mockDb.execute.mockResolvedValueOnce([mockRows]);

      const filters: CompetencyListFilters = { level: 'CE2', subject: 'FR' };
      const result = await competenciesService.getCompetenciesList(mockDb, filters);

      expect(result).toEqual(mockRows);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringMatching(/code LIKE 'CE2\.%'.*matiere = 'FR'/)
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.execute.mockRejectedValueOnce(dbError);

      await expect(competenciesService.getCompetenciesList(mockDb)).rejects.toThrow(
        'Failed to fetch competencies list'
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error fetching competencies list:',
        dbError
      );
    });
  });

  describe('getCompetencyWithContent', () => {
    it('should return competency with content', async () => {
      mockDb.execute.mockResolvedValueOnce([[mockCompetencyRow]]);
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockCompetencyContent));

      const result = await competenciesService.getCompetencyWithContent(mockDb, 'CE2.FR.L.FL.01');

      expect(result).toEqual({
        ...mockCompetencyRow,
        content: mockCompetencyContent
      });
    });

    it('should return competency without content when content loading fails', async () => {
      mockDb.execute.mockResolvedValueOnce([[mockCompetencyRow]]);
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      const result = await competenciesService.getCompetencyWithContent(mockDb, 'CE2.FR.L.FL.01');

      expect(result).toEqual({
        ...mockCompetencyRow,
        content: null
      });
    });

    it('should return null for non-existent competency', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]);

      const result = await competenciesService.getCompetencyWithContent(mockDb, 'INVALID.CODE');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockDb.execute.mockRejectedValueOnce(dbError);

      await expect(
        competenciesService.getCompetencyWithContent(mockDb, 'CE2.FR.L.FL.01')
      ).rejects.toThrow('Failed to fetch competency: CE2.FR.L.FL.01');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error fetching competency CE2.FR.L.FL.01:',
        dbError
      );
    });
  });

  describe('generateListCacheKey', () => {
    it('should generate cache key with all filters', () => {
      const filters: CompetencyListFilters = {
        level: 'CE2',
        subject: 'FR',
        limit: 50,
        offset: 10
      };

      const key = competenciesService.generateListCacheKey(filters);

      expect(key).toBe('comp:list:CE2:FR:50:10');
    });

    it('should generate cache key with default values', () => {
      const key = competenciesService.generateListCacheKey({});
      expect(key).toBe('comp:list:all:all:100:0');
    });

    it('should generate cache key with partial filters', () => {
      const filters: CompetencyListFilters = { level: 'CE1' };
      const key = competenciesService.generateListCacheKey(filters);
      expect(key).toBe('comp:list:CE1:all:100:0');
    });
  });

  describe('generateItemCacheKey', () => {
    it('should generate correct item cache key', () => {
      const key = competenciesService.generateItemCacheKey('CE2.FR.L.FL.01');
      expect(key).toBe('comp:item:CE2.FR.L.FL.01');
    });
  });

  describe('validateCompetencyCode', () => {
    it('should validate correct competency codes', () => {
      const validCodes = [
        'CE2.FR.L.FL.01',
        'CE1.MA.N.CO.05',
        'CP.FR.E.PR.12'
      ];

      validCodes.forEach(code => {
        expect(competenciesService.validateCompetencyCode(code)).toBe(true);
      });
    });

    it('should reject invalid competency codes', () => {
      const invalidCodes = [
        'INVALID.CODE',
        'CE2.FR.L', // Too few parts
        'CE2.FR.L.FL.01.EXTRA', // Too many parts
        'CE3.FR.L.FL.01', // Invalid level
        'CE2.EN.L.FL.01', // Invalid subject
        ''
      ];

      invalidCodes.forEach(code => {
        expect(competenciesService.validateCompetencyCode(code)).toBe(false);
      });
    });
  });

  describe('clearContentCache', () => {
    it('should clear the content cache', async () => {
      // Load some content first
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockCompetencyContent));
      await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');

      let stats = competenciesService.getCacheStats();
      expect(stats.size).toBe(1);

      competenciesService.clearContentCache();

      stats = competenciesService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(mockConsole.log).toHaveBeenCalledWith('Competency content cache cleared');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      // Load some content first
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockCompetencyContent));
      await competenciesService.loadCompetencyContent('CE2.FR.L.FL.01');

      const stats = competenciesService.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.keys).toEqual(['CE2.FR.L.FL.01']);
    });

    it('should return empty stats for empty cache', () => {
      const stats = competenciesService.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('preloadContentForLevel', () => {
    it('should preload content for valid level', async () => {
      const mockAccess = fs.access as MockedFunction<typeof fs.access>;
      const mockReaddir = fs.readdir as MockedFunction<typeof fs.readdir>;
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReaddir
        .mockResolvedValueOnce(['CE2.FR.L.FL.01.json', 'CE2.FR.L.FL.02.json'] as any)
        .mockResolvedValueOnce(['CE2.MA.N.CO.01.json'] as any);
      mockReadFile.mockResolvedValue(JSON.stringify(mockCompetencyContent));

      await competenciesService.preloadContentForLevel('CE2');

      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining('CE2')
      );
      expect(mockReaddir).toHaveBeenCalledTimes(2); // FR and MA
      expect(mockReadFile).toHaveBeenCalledTimes(3); // 2 FR files + 1 MA file
      expect(mockConsole.log).toHaveBeenCalledWith('Preloading content for level: CE2');
      expect(mockConsole.log).toHaveBeenCalledWith('Preloaded 2 files for CE2.FR');
      expect(mockConsole.log).toHaveBeenCalledWith('Preloaded 1 files for CE2.MA');
    });

    it('should handle missing level directory', async () => {
      const mockAccess = fs.access as MockedFunction<typeof fs.access>;
      mockAccess.mockRejectedValueOnce(new Error('Directory not found'));

      await competenciesService.preloadContentForLevel('CE3');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Content directory not found for level: CE3'
      );
    });

    it('should handle missing subject directory', async () => {
      const mockAccess = fs.access as MockedFunction<typeof fs.access>;
      const mockReaddir = fs.readdir as MockedFunction<typeof fs.readdir>;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReaddir
        .mockRejectedValueOnce(new Error('FR directory not found'))
        .mockResolvedValueOnce(['CE2.MA.N.CO.01.json'] as any);

      await competenciesService.preloadContentForLevel('CE2');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Error preloading CE2.FR:',
        'FR directory not found'
      );
    });

    it('should handle preloading errors gracefully', async () => {
      const mockAccess = fs.access as MockedFunction<typeof fs.access>;
      mockAccess.mockRejectedValueOnce(new Error('Unexpected error'));

      await competenciesService.preloadContentForLevel('CE2');

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error preloading content for level CE2:',
        expect.any(Error)
      );
    });

    it('should filter only JSON files during preload', async () => {
      const mockAccess = fs.access as MockedFunction<typeof fs.access>;
      const mockReaddir = fs.readdir as MockedFunction<typeof fs.readdir>;
      const mockReadFile = fs.readFile as MockedFunction<typeof fs.readFile>;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReaddir
        .mockResolvedValueOnce([
          'CE2.FR.L.FL.01.json',
          'README.txt',
          '.DS_Store',
          'CE2.FR.L.FL.02.json'
        ] as any)
        .mockResolvedValueOnce([] as any); // Empty MA directory

      mockReadFile.mockResolvedValue(JSON.stringify(mockCompetencyContent));

      await competenciesService.preloadContentForLevel('CE2');

      expect(mockReadFile).toHaveBeenCalledTimes(2); // Only the 2 JSON files
      expect(mockConsole.log).toHaveBeenCalledWith('Preloaded 2 files for CE2.FR');
      expect(mockConsole.log).toHaveBeenCalledWith('Preloaded 0 files for CE2.MA');
    });
  });
});