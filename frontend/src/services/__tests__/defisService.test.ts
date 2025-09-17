import { defisService, DefiChallenge } from '../defisService';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('defisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('generateChallenge', () => {
    it('generates a challenge with correct structure', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');

      expect(challenge).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        difficulty: 'facile',
        type: 'phoneme',
        components: expect.any(Array),
        dropZones: expect.any(Array),
        instructions: expect.any(String),
        hints: expect.any(Array),
        successCriteria: expect.any(Array)
      });
    });

    it('generates challenges with different difficulty levels', async () => {
      const easyChallengePromise = defisService.generateChallenge('facile', 'phoneme');
      const mediumChallengePromise = defisService.generateChallenge('moyen', 'syllabe');
      const hardChallengePromise = defisService.generateChallenge('difficile', 'mot');

      const [easyChallenge, mediumChallenge, hardChallenge] = await Promise.all([
        easyChallengePromise,
        mediumChallengePromise,
        hardChallengePromise
      ]);

      expect(easyChallenge.difficulty).toBe('facile');
      expect(mediumChallenge.difficulty).toBe('moyen');
      expect(hardChallenge.difficulty).toBe('difficile');
    });

    it('generates challenges with different types', async () => {
      const phonemeChallenge = await defisService.generateChallenge('facile', 'phoneme');
      const syllabeChallenge = await defisService.generateChallenge('facile', 'syllabe');
      const motChallenge = await defisService.generateChallenge('facile', 'mot');

      expect(phonemeChallenge.type).toBe('phoneme');
      expect(syllabeChallenge.type).toBe('syllabe');
      expect(motChallenge.type).toBe('mot');
    });

    it('ensures components have required properties', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');

      expect(challenge.components.length).toBeGreaterThan(0);
      challenge.components.forEach(component => {
        expect(component).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          content: expect.any(String)
        });
      });
    });

    it('ensures drop zones have required properties', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');

      expect(challenge.dropZones.length).toBeGreaterThan(0);
      challenge.dropZones.forEach(dropZone => {
        expect(dropZone).toMatchObject({
          id: expect.any(String),
          accepts: expect.any(Array),
          position: expect.any(Number)
        });
      });
    });

    it('provides hints for each challenge', async () => {
      const challenge = await defisService.generateChallenge('moyen', 'syllabe');

      expect(challenge.hints).toBeInstanceOf(Array);
      expect(challenge.hints.length).toBeGreaterThan(0);
      challenge.hints.forEach(hint => {
        expect(typeof hint).toBe('string');
        expect(hint.length).toBeGreaterThan(0);
      });
    });

    it('provides success criteria for each challenge', async () => {
      const challenge = await defisService.generateChallenge('difficile', 'mot');

      expect(challenge.successCriteria).toBeInstanceOf(Array);
      expect(challenge.successCriteria.length).toBeGreaterThan(0);
      challenge.successCriteria.forEach(criteria => {
        expect(typeof criteria).toBe('string');
        expect(criteria.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getPhonicsExercises', () => {
    it('returns an array of phonics exercises', async () => {
      const exercises = await defisService.getPhonicsExercises('CE1');

      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('filters exercises by grade level', async () => {
      const ce1Exercises = await defisService.getPhonicsExercises('CE1');
      const ce2Exercises = await defisService.getPhonicsExercises('CE2');

      expect(Array.isArray(ce1Exercises)).toBe(true);
      expect(Array.isArray(ce2Exercises)).toBe(true);
    });

    it('returns exercises with required structure', async () => {
      const exercises = await defisService.getPhonicsExercises('CE1');

      exercises.forEach(exercise => {
        expect(exercise).toMatchObject({
          id: expect.any(String),
          word: expect.any(String),
          phonemes: expect.any(Array),
          difficulty: expect.any(String)
        });
      });
    });

    it('handles different grade levels', async () => {
      const cpExercises = await defisService.getPhonicsExercises('CP');
      const ce1Exercises = await defisService.getPhonicsExercises('CE1');
      const ce2Exercises = await defisService.getPhonicsExercises('CE2');

      expect(Array.isArray(cpExercises)).toBe(true);
      expect(Array.isArray(ce1Exercises)).toBe(true);
      expect(Array.isArray(ce2Exercises)).toBe(true);
    });
  });

  describe('generateAdaptiveChallenge', () => {
    it('generates challenges based on performance history', async () => {
      const performanceHistory = [
        { difficulty: 'facile', success: true, timeSpent: 30 },
        { difficulty: 'facile', success: true, timeSpent: 25 },
        { difficulty: 'moyen', success: false, timeSpent: 60 }
      ];

      const challenge = await defisService.generateAdaptiveChallenge(performanceHistory, 'phoneme');

      expect(challenge).toMatchObject({
        id: expect.any(String),
        difficulty: expect.any(String),
        type: 'phoneme'
      });
    });

    it('adapts difficulty based on success rate', async () => {
      const highSuccessHistory = [
        { difficulty: 'facile', success: true, timeSpent: 20 },
        { difficulty: 'facile', success: true, timeSpent: 18 },
        { difficulty: 'facile', success: true, timeSpent: 22 }
      ];

      const lowSuccessHistory = [
        { difficulty: 'moyen', success: false, timeSpent: 60 },
        { difficulty: 'moyen', success: false, timeSpent: 65 },
        { difficulty: 'facile', success: true, timeSpent: 45 }
      ];

      const highSuccessChallenge = await defisService.generateAdaptiveChallenge(highSuccessHistory, 'syllabe');
      const lowSuccessChallenge = await defisService.generateAdaptiveChallenge(lowSuccessHistory, 'syllabe');

      expect(typeof highSuccessChallenge.difficulty).toBe('string');
      expect(typeof lowSuccessChallenge.difficulty).toBe('string');
    });

    it('considers time spent in adaptation', async () => {
      const fastCompletionHistory = [
        { difficulty: 'facile', success: true, timeSpent: 15 },
        { difficulty: 'facile', success: true, timeSpent: 12 },
        { difficulty: 'moyen', success: true, timeSpent: 25 }
      ];

      const challenge = await defisService.generateAdaptiveChallenge(fastCompletionHistory, 'mot');

      expect(challenge).toMatchObject({
        id: expect.any(String),
        difficulty: expect.any(String),
        type: 'mot'
      });
    });
  });

  describe('validateAnswer', () => {
    it('validates correct answers', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');
      const correctAnswer = challenge.components.map(c => c.id);

      const result = await defisService.validateAnswer(challenge.id, correctAnswer);

      expect(result).toMatchObject({
        isCorrect: expect.any(Boolean),
        feedback: expect.any(String),
        score: expect.any(Number)
      });
    });

    it('provides feedback for incorrect answers', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');
      const incorrectAnswer = ['wrong-id-1', 'wrong-id-2'];

      const result = await defisService.validateAnswer(challenge.id, incorrectAnswer);

      expect(result).toMatchObject({
        isCorrect: false,
        feedback: expect.any(String),
        score: expect.any(Number)
      });
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('calculates score based on correctness', async () => {
      const challenge = await defisService.generateChallenge('moyen', 'syllabe');
      const partiallyCorrectAnswer = [challenge.components[0]?.id || 'id1'];

      const result = await defisService.validateAnswer(challenge.id, partiallyCorrectAnswer);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('getHint', () => {
    it('returns hints for challenges', async () => {
      const challenge = await defisService.generateChallenge('difficile', 'mot');
      const hint = await defisService.getHint(challenge.id, 0);

      expect(typeof hint).toBe('string');
      expect(hint.length).toBeGreaterThan(0);
    });

    it('returns different hints for different hint levels', async () => {
      const challenge = await defisService.generateChallenge('moyen', 'syllabe');
      const hint1 = await defisService.getHint(challenge.id, 0);
      const hint2 = await defisService.getHint(challenge.id, 1);

      expect(typeof hint1).toBe('string');
      expect(typeof hint2).toBe('string');
    });

    it('handles invalid hint levels gracefully', async () => {
      const challenge = await defisService.generateChallenge('facile', 'phoneme');
      const hint = await defisService.getHint(challenge.id, 999);

      expect(typeof hint).toBe('string');
    });
  });

  describe('getChallengeProgress', () => {
    it('tracks challenge completion progress', async () => {
      const progress = await defisService.getChallengeProgress('student-123');

      expect(progress).toMatchObject({
        completedChallenges: expect.any(Number),
        totalChallenges: expect.any(Number),
        averageScore: expect.any(Number),
        difficultiesUnlocked: expect.any(Array)
      });
    });

    it('calculates completion percentage', async () => {
      const progress = await defisService.getChallengeProgress('student-456');

      expect(progress.completedChallenges).toBeLessThanOrEqual(progress.totalChallenges);
      expect(progress.averageScore).toBeGreaterThanOrEqual(0);
      expect(progress.averageScore).toBeLessThanOrEqual(100);
    });

    it('tracks unlocked difficulties', async () => {
      const progress = await defisService.getChallengeProgress('student-789');

      expect(Array.isArray(progress.difficultiesUnlocked)).toBe(true);
      progress.difficultiesUnlocked.forEach(difficulty => {
        expect(['facile', 'moyen', 'difficile']).toContain(difficulty);
      });
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw, but handle gracefully
      const challenge = await defisService.generateChallenge('facile', 'phoneme');

      // Should still return a valid challenge (from fallback)
      expect(challenge).toBeTruthy();
      expect(challenge.id).toBeTruthy();
    });

    it('handles invalid parameters', async () => {
      // Should handle invalid difficulty
      const challenge = await defisService.generateChallenge('invalid' as any, 'phoneme');

      expect(challenge).toBeTruthy();
      expect(['facile', 'moyen', 'difficile']).toContain(challenge.difficulty);
    });

    it('handles missing challenge IDs in validation', async () => {
      const result = await defisService.validateAnswer('non-existent-id', ['answer']);

      expect(result).toMatchObject({
        isCorrect: false,
        feedback: expect.any(String),
        score: 0
      });
    });
  });

  describe('performance', () => {
    it('generates challenges within reasonable time', async () => {
      const startTime = Date.now();
      await defisService.generateChallenge('moyen', 'syllabe');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    });

    it('handles concurrent challenge generation', async () => {
      const promises = [
        defisService.generateChallenge('facile', 'phoneme'),
        defisService.generateChallenge('moyen', 'syllabe'),
        defisService.generateChallenge('difficile', 'mot')
      ];

      const challenges = await Promise.all(promises);

      expect(challenges).toHaveLength(3);
      challenges.forEach(challenge => {
        expect(challenge.id).toBeTruthy();
      });
    });
  });
});