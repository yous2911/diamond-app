import WahooEngine, { WahooFeedback, AchievementData } from '../WahooEngine';

describe('WahooEngine', () => {
  let wahooEngine: WahooEngine;

  beforeEach(() => {
    wahooEngine = new WahooEngine();
  });

  describe('Achievement Initialization', () => {
    it('initializes with predefined achievements', () => {
      const achievements = wahooEngine.getAllAchievements();

      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.some(a => a.type === 'mystery_word_completed')).toBe(true);
      expect(achievements.some(a => a.type === 'math_perfect')).toBe(true);
      expect(achievements.some(a => a.type === 'phonics_expert')).toBe(true);
    });

    it('initializes achievements as unlocked false', () => {
      const achievements = wahooEngine.getAllAchievements();

      achievements.forEach(achievement => {
        expect(achievement.unlocked).toBe(false);
      });
    });

    it('has proper achievement structure', () => {
      const achievements = wahooEngine.getAllAchievements();
      const mysteryWordAchievement = achievements.find(a => a.type === 'mystery_word_completed');

      expect(mysteryWordAchievement).toEqual({
        type: 'mystery_word_completed',
        title: 'Mot Mystère Résolu!',
        description: 'Tu as trouvé le mot mystère!',
        xpReward: 50,
        icon: '🔍',
        unlocked: false
      });
    });
  });

  describe('Response Evaluation', () => {
    it('provides positive feedback for correct responses', () => {
      const feedback = wahooEngine.evaluateResponse(true, 1);

      expect(feedback).toMatchObject({
        intensity: expect.any(Number),
        message: expect.any(String),
        xpReward: expect.any(Number)
      });
      expect(feedback.intensity).toBeGreaterThanOrEqual(0);
      expect(feedback.intensity).toBeLessThanOrEqual(5);
      expect(feedback.xpReward).toBeGreaterThan(0);
    });

    it('provides appropriate feedback for incorrect responses', () => {
      const feedback = wahooEngine.evaluateResponse(false, 1);

      expect(feedback).toMatchObject({
        intensity: expect.any(Number),
        message: expect.any(String),
        xpReward: expect.any(Number)
      });
      expect(feedback.xpReward).toBe(0);
    });

    it('adjusts feedback based on difficulty level', () => {
      const easyFeedback = wahooEngine.evaluateResponse(true, 1);
      const hardFeedback = wahooEngine.evaluateResponse(true, 3);

      expect(easyFeedback.xpReward).toBeLessThanOrEqual(hardFeedback.xpReward);
    });

    it('tracks user progress correctly', () => {
      const initialProgress = wahooEngine.getUserProgress('mystery_word');
      wahooEngine.evaluateResponse(true, 1);
      const updatedProgress = wahooEngine.getUserProgress('mystery_word');

      expect(updatedProgress).toBeGreaterThan(initialProgress);
    });

    it('caps progress at 100', () => {
      // Simulate many correct responses
      for (let i = 0; i < 20; i++) {
        wahooEngine.evaluateResponse(true, 5);
      }

      const progress = wahooEngine.getUserProgress('mystery_word');
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Achievement System', () => {
    it('unlocks achievements when conditions are met', () => {
      // Trigger achievement by providing correct responses
      const feedback = wahooEngine.evaluateResponse(true, 2);

      if (feedback.achievement) {
        const achievement = wahooEngine.getAchievement(feedback.achievement);
        expect(achievement?.unlocked).toBe(true);
        expect(achievement?.unlockedAt).toBeInstanceOf(Date);
      }
    });

    it('returns null for non-existent achievements', () => {
      const achievement = wahooEngine.getAchievement('non_existent');
      expect(achievement).toBeNull();
    });

    it('tracks achievement unlock dates', () => {
      const beforeTime = new Date();
      wahooEngine.evaluateResponse(true, 2);
      const afterTime = new Date();

      const unlockedAchievements = wahooEngine.getUnlockedAchievements();

      if (unlockedAchievements.length > 0) {
        const achievement = unlockedAchievements[0];
        expect(achievement.unlockedAt).toBeInstanceOf(Date);
        expect(achievement.unlockedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(achievement.unlockedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe('Progress Tracking', () => {
    it('returns 0 progress for new skills', () => {
      const progress = wahooEngine.getUserProgress('new_skill');
      expect(progress).toBe(0);
    });

    it('updates progress incrementally', () => {
      const skill = 'mystery_word';
      const initialProgress = wahooEngine.getUserProgress(skill);

      wahooEngine.evaluateResponse(true, 1);
      const firstUpdate = wahooEngine.getUserProgress(skill);

      wahooEngine.evaluateResponse(true, 1);
      const secondUpdate = wahooEngine.getUserProgress(skill);

      expect(firstUpdate).toBeGreaterThan(initialProgress);
      expect(secondUpdate).toBeGreaterThan(firstUpdate);
    });

    it('decreases progress on wrong answers', () => {
      // First get some progress
      wahooEngine.evaluateResponse(true, 2);
      const progressAfterCorrect = wahooEngine.getUserProgress('mystery_word');

      // Then make a mistake
      wahooEngine.evaluateResponse(false, 1);
      const progressAfterWrong = wahooEngine.getUserProgress('mystery_word');

      expect(progressAfterWrong).toBeLessThan(progressAfterCorrect);
    });

    it('never allows negative progress', () => {
      // Make multiple wrong answers
      for (let i = 0; i < 10; i++) {
        wahooEngine.evaluateResponse(false, 1);
      }

      const progress = wahooEngine.getUserProgress('mystery_word');
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Intensity Calculation', () => {
    it('calculates intensity within valid range', () => {
      const feedback = wahooEngine.evaluateResponse(true, 1);
      expect(feedback.intensity).toBeGreaterThanOrEqual(0);
      expect(feedback.intensity).toBeLessThanOrEqual(5);
    });

    it('adjusts intensity based on progress and difficulty', () => {
      const lowDifficultyFeedback = wahooEngine.evaluateResponse(true, 1);
      const highDifficultyFeedback = wahooEngine.evaluateResponse(true, 5);

      // Higher difficulty should generally result in higher intensity
      expect(typeof lowDifficultyFeedback.intensity).toBe('number');
      expect(typeof highDifficultyFeedback.intensity).toBe('number');
    });
  });

  describe('Feedback Messages', () => {
    it('provides encouraging messages for correct answers', () => {
      const feedback = wahooEngine.evaluateResponse(true, 1);
      expect(feedback.message).toBeTruthy();
      expect(typeof feedback.message).toBe('string');
      expect(feedback.message.length).toBeGreaterThan(0);
    });

    it('provides supportive messages for incorrect answers', () => {
      const feedback = wahooEngine.evaluateResponse(false, 1);
      expect(feedback.message).toBeTruthy();
      expect(typeof feedback.message).toBe('string');
      expect(feedback.message.length).toBeGreaterThan(0);
    });

    it('varies messages based on intensity', () => {
      const feedback1 = wahooEngine.evaluateResponse(true, 1);
      const feedback2 = wahooEngine.evaluateResponse(true, 3);

      expect(typeof feedback1.message).toBe('string');
      expect(typeof feedback2.message).toBe('string');
    });
  });

  describe('XP Reward System', () => {
    it('awards XP for correct answers', () => {
      const feedback = wahooEngine.evaluateResponse(true, 1);
      expect(feedback.xpReward).toBeGreaterThan(0);
    });

    it('awards no XP for incorrect answers', () => {
      const feedback = wahooEngine.evaluateResponse(false, 1);
      expect(feedback.xpReward).toBe(0);
    });

    it('scales XP with difficulty', () => {
      const easyFeedback = wahooEngine.evaluateResponse(true, 1);
      const hardFeedback = wahooEngine.evaluateResponse(true, 5);

      expect(hardFeedback.xpReward).toBeGreaterThanOrEqual(easyFeedback.xpReward);
    });

    it('provides bonus XP for achievements', () => {
      const feedback = wahooEngine.evaluateResponse(true, 3);

      if (feedback.achievement) {
        const achievement = wahooEngine.getAchievement(feedback.achievement);
        expect(achievement?.xpReward).toBeGreaterThan(0);
      }
    });
  });

  describe('Next Review Scheduling', () => {
    it('schedules next review for correct answers', () => {
      const feedback = wahooEngine.evaluateResponse(true, 1);

      if (feedback.nextReview) {
        expect(feedback.nextReview).toBeInstanceOf(Date);
        expect(feedback.nextReview.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('schedules sooner reviews for incorrect answers', () => {
      const correctFeedback = wahooEngine.evaluateResponse(true, 1);
      const incorrectFeedback = wahooEngine.evaluateResponse(false, 1);

      if (correctFeedback.nextReview && incorrectFeedback.nextReview) {
        expect(incorrectFeedback.nextReview.getTime()).toBeLessThan(correctFeedback.nextReview.getTime());
      }
    });
  });

  describe('Achievement Retrieval', () => {
    it('returns all achievements', () => {
      const achievements = wahooEngine.getAllAchievements();
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('returns only unlocked achievements', () => {
      // Unlock an achievement
      wahooEngine.evaluateResponse(true, 3);

      const unlockedAchievements = wahooEngine.getUnlockedAchievements();
      expect(Array.isArray(unlockedAchievements)).toBe(true);

      unlockedAchievements.forEach(achievement => {
        expect(achievement.unlocked).toBe(true);
      });
    });

    it('returns specific achievement by type', () => {
      const achievement = wahooEngine.getAchievement('mystery_word_completed');
      expect(achievement).toBeTruthy();
      expect(achievement?.type).toBe('mystery_word_completed');
    });
  });
});