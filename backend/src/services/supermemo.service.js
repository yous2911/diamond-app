"use strict";
/**
 * SuperMemo-2 Spaced Repetition Algorithm Implementation
 *
 * This implementation is based on the SuperMemo-2 algorithm developed by
 * Piotr Wozniak for optimizing memory retention through spaced repetition.
 *
 * Adapted for the FastRevEd Kids educational platform to optimize
 * learning intervals for elementary school students (CP/CE1/CE2).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperMemoService = void 0;
/**
 * SuperMemo-2 Algorithm Service
 * Optimized for young learners (6-11 years old)
 */
class SuperMemoService {
    /**
     * Calculate quality score (0-5) based on student response
     * Adapted for elementary students with emphasis on engagement over perfection
     *
     * Scoring breakdown:
     * - Correctness: 0-3 points (correct = 3, incorrect with hints = 0.5-1)
     * - Time pacing: 0-1 points (appropriate speed = 1, slow = 0.5)
     * - Hint usage: 0-1 points (no hints = 1, reasonable = 0.5)
     * - Confidence: 0-0.5 bonus (if provided)
     */
    static calculateQuality(response) {
        let quality = 0;
        // Base quality on correctness (0-3 points)
        if (response.isCorrect) {
            quality += this.QUALITY_SCORING.CORRECT_BASE;
        }
        else {
            // Partial credit for attempt and engagement
            quality += response.hintsUsed <= 1
                ? this.QUALITY_SCORING.INCORRECT_WITH_HINTS
                : this.QUALITY_SCORING.INCORRECT_MANY_HINTS;
        }
        // Time factor (0-1 points)
        // Reward appropriate pacing - not too fast (guessing) or too slow (struggling)
        const expectedTime = this.getExpectedTimeForDifficulty(response.difficulty);
        const timeRatio = response.timeSpent / expectedTime;
        if (timeRatio >= this.QUALITY_SCORING.TIME_GOOD_MIN &&
            timeRatio <= this.QUALITY_SCORING.TIME_GOOD_MAX) {
            quality += this.QUALITY_SCORING.TIME_GOOD_SCORE;
        }
        else if (timeRatio > this.QUALITY_SCORING.TIME_GOOD_MAX &&
            timeRatio <= this.QUALITY_SCORING.TIME_OK_MAX) {
            quality += this.QUALITY_SCORING.TIME_OK_SCORE;
        }
        // Hint usage factor (0-1 points)
        if (response.hintsUsed === 0) {
            quality += this.QUALITY_SCORING.HINTS_NONE_SCORE;
        }
        else if (response.hintsUsed <= this.QUALITY_SCORING.HINTS_REASONABLE_MAX) {
            quality += this.QUALITY_SCORING.HINTS_REASONABLE_SCORE;
        }
        // Confidence bonus (if provided, max 0.5 points)
        if (response.confidence !== undefined) {
            const confidenceScore = (response.confidence / this.QUALITY_SCORING.CONFIDENCE_MAX) *
                this.QUALITY_SCORING.CONFIDENCE_BONUS_MULTIPLIER;
            quality += confidenceScore;
        }
        // Normalize to 0-5 scale and round to nearest 0.5
        const normalizedQuality = Math.min(5, Math.max(0, quality));
        return Math.round(normalizedQuality * 2) / 2;
    }
    /**
     * Get expected time based on exercise difficulty
     * Returns expected completion time in seconds for a given difficulty level (0-5)
     */
    static getExpectedTimeForDifficulty(difficulty) {
        // Expected times in seconds for different difficulty levels (0-5 scale)
        const baseTimes = [30, 45, 60, 90, 120, 180];
        const clampedDifficulty = Math.min(5, Math.max(0, Math.floor(difficulty)));
        return baseTimes[clampedDifficulty] ?? 60;
    }
    /**
     * Core SuperMemo-2 algorithm implementation
     * Modified for young learners (6-11 years) with more forgiving intervals
     *
     * @param currentCard - Current spaced repetition card data (may be partial for new cards)
     * @param quality - Quality score (0-5) from calculateQuality()
     * @returns SuperMemoResult with updated interval, easiness factor, and next review date
     */
    static calculateNextReview(currentCard, quality) {
        // Initialize card state with defaults for new cards
        const easinessFactor = currentCard.easinessFactor ?? this.INITIAL_EASINESS_FACTOR;
        const repetitionNumber = currentCard.repetitionNumber ?? 0;
        const lastInterval = currentCard.interval ?? 0;
        // Process review based on quality
        const isSuccessful = quality >= this.QUALITY_THRESHOLD;
        const { newEasinessFactor, newRepetitionNumber, newInterval } = isSuccessful
            ? this.processSuccessfulReview(easinessFactor, repetitionNumber, lastInterval, quality)
            : this.processFailedReview(easinessFactor, repetitionNumber);
        // Apply maximum interval limits for young learners
        const limitedInterval = this.applyIntervalLimits(newInterval, newRepetitionNumber);
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + limitedInterval);
        // Determine difficulty level and review status
        const difficulty = this.getDifficultyLevel(newEasinessFactor, newRepetitionNumber);
        const shouldReview = currentCard.nextReview
            ? new Date() >= new Date(currentCard.nextReview)
            : true;
        return {
            easinessFactor: Math.round(newEasinessFactor * 100) / 100,
            repetitionNumber: newRepetitionNumber,
            interval: limitedInterval,
            nextReviewDate,
            shouldReview,
            difficulty
        };
    }
    /**
     * Process successful review (quality >= threshold)
     */
    static processSuccessfulReview(easinessFactor, repetitionNumber, lastInterval, quality) {
        const newRepetitionNumber = repetitionNumber + 1;
        // Calculate new interval based on repetition number
        let newInterval;
        if (newRepetitionNumber === 1) {
            newInterval = this.INITIAL_INTERVAL;
        }
        else if (newRepetitionNumber === 2) {
            newInterval = this.SECOND_INTERVAL;
        }
        else {
            // Standard SuperMemo formula: interval = lastInterval * easinessFactor
            newInterval = Math.round(lastInterval * easinessFactor);
        }
        // Update easiness factor using SuperMemo-2 formula
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const qualityDelta = 5 - quality;
        const easinessDelta = this.EASINESS_SUCCESS_FORMULA_BASE -
            (qualityDelta * (this.EASINESS_SUCCESS_FORMULA_1 + qualityDelta * this.EASINESS_SUCCESS_FORMULA_2));
        const newEasinessFactor = Math.max(this.MIN_EASINESS_FACTOR, Math.min(this.MAX_EASINESS_FACTOR, easinessFactor + easinessDelta));
        return { newEasinessFactor, newRepetitionNumber, newInterval };
    }
    /**
     * Process failed review (quality < threshold)
     * More forgiving for young learners - keeps partial progress
     */
    static processFailedReview(easinessFactor, repetitionNumber) {
        // More forgiving reset - keep some progress
        const newRepetitionNumber = Math.max(0, repetitionNumber - 1);
        const newInterval = 1; // Review again tomorrow
        // Reduce easiness factor more gently for kids
        const newEasinessFactor = Math.max(this.MIN_EASINESS_FACTOR, easinessFactor - this.EASINESS_PENALTY);
        return { newEasinessFactor, newRepetitionNumber, newInterval };
    }
    /**
     * Apply interval limits appropriate for young learners
     * Prevents intervals from growing too large for children's attention spans
     */
    static applyIntervalLimits(interval, repetitionNumber) {
        let maxInterval;
        if (repetitionNumber <= 2) {
            maxInterval = this.MAX_INTERVALS.BEGINNER;
        }
        else if (repetitionNumber <= 4) {
            maxInterval = this.MAX_INTERVALS.ELEMENTARY;
        }
        else if (repetitionNumber <= 8) {
            maxInterval = this.MAX_INTERVALS.INTERMEDIATE;
        }
        else {
            maxInterval = this.MAX_INTERVALS.ADVANCED;
        }
        return Math.min(interval, maxInterval);
    }
    /**
     * Determine difficulty level based on easiness factor and repetition number
     */
    static getDifficultyLevel(easinessFactor, repetitionNumber) {
        // Always beginner for first few repetitions
        if (repetitionNumber <= 1) {
            return 'beginner';
        }
        // Classify by easiness factor
        if (easinessFactor >= this.EASINESS_THRESHOLDS.EASY) {
            return 'easy';
        }
        else if (easinessFactor >= this.EASINESS_THRESHOLDS.MEDIUM) {
            return 'medium';
        }
        else if (easinessFactor >= this.EASINESS_THRESHOLDS.HARD) {
            return 'hard';
        }
        else {
            return 'very_hard';
        }
    }
    /**
     * Get recommended study schedule for competences
     *
     * @param cards - Array of spaced repetition cards
     * @param maxCardsPerDay - Maximum cards to review per day (default: 10)
     * @returns Study schedule with due cards, upcoming cards, and 7-day calendar
     */
    static getStudySchedule(cards, maxCardsPerDay = this.DEFAULT_MAX_CARDS_PER_DAY) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        // Filter and sort cards due for review
        const due = cards
            .filter(card => new Date(card.nextReview) <= now)
            .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
            .slice(0, maxCardsPerDay);
        // Filter upcoming cards (next 7 days)
        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + this.SCHEDULE_DAYS);
        const upcoming = cards
            .filter(card => {
            const reviewDate = new Date(card.nextReview);
            return reviewDate > now && reviewDate <= weekFromNow;
        })
            .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
        // Create 7-day schedule
        const schedule = Array.from({ length: this.SCHEDULE_DAYS }, (_, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            const cardsForDate = cards
                .filter(card => {
                const reviewDate = new Date(card.nextReview);
                reviewDate.setHours(0, 0, 0, 0);
                return reviewDate.getTime() === date.getTime();
            })
                .slice(0, maxCardsPerDay);
            return {
                date: date.toISOString().split('T')[0],
                cards: cardsForDate
            };
        });
        return { due, upcoming, schedule };
    }
    /**
     * Analyze learning progress for a student
     *
     * @param cards - Array of spaced repetition cards
     * @returns Progress metrics including mastery levels and success rates
     */
    static analyzeLearningProgress(cards) {
        if (cards.length === 0) {
            return {
                totalCards: 0,
                mastered: 0,
                learning: 0,
                difficult: 0,
                averageEasiness: this.INITIAL_EASINESS_FACTOR,
                averageInterval: 0,
                successRate: 0
            };
        }
        // Calculate mastery levels
        const mastered = cards.filter(card => card.easinessFactor >= this.MASTERED_THRESHOLD.EASINESS_FACTOR &&
            card.repetitionNumber >= this.MASTERED_THRESHOLD.MIN_REPETITIONS).length;
        const difficult = cards.filter(card => card.easinessFactor <= this.DIFFICULT_THRESHOLD).length;
        const learning = cards.length - mastered - difficult;
        // Calculate averages
        const averageEasiness = cards.reduce((sum, card) => sum + card.easinessFactor, 0) / cards.length;
        const averageInterval = cards.reduce((sum, card) => sum + card.interval, 0) / cards.length;
        // Calculate success rate
        const successfulCards = cards.filter(card => card.easinessFactor >= this.SUCCESS_THRESHOLD.EASINESS_FACTOR &&
            card.quality >= this.SUCCESS_THRESHOLD.QUALITY).length;
        const successRate = successfulCards / cards.length;
        return {
            totalCards: cards.length,
            mastered,
            learning,
            difficult,
            averageEasiness: Math.round(averageEasiness * 100) / 100,
            averageInterval: Math.round(averageInterval * 10) / 10,
            successRate: Math.round(successRate * 100) / 100
        };
    }
    /**
     * Get personalized recommendations for a student
     *
     * @param cards - Array of spaced repetition cards
     * @returns Array of personalized learning recommendations
     */
    static getPersonalizedRecommendations(cards) {
        const recommendations = [];
        const now = new Date();
        // Check for difficult competences
        const difficultCards = cards.filter(card => card.easinessFactor <= this.DIFFICULT_THRESHOLD);
        if (difficultCards.length > 0) {
            recommendations.push({
                action: "Focus on difficult competences with extra practice",
                reason: `${difficultCards.length} competences need additional attention`,
                competences: difficultCards.map(card => card.competenceId)
            });
        }
        // Check for review overload
        const dueCards = cards.filter(card => new Date(card.nextReview) <= now);
        if (dueCards.length > this.REVIEW_OVERLOAD_THRESHOLD) {
            recommendations.push({
                action: "Prioritize reviews to avoid overload",
                reason: `${dueCards.length} competences are due for review`,
                competences: dueCards
                    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
                    .slice(0, this.MAX_RECOMMENDATIONS_TO_RETURN)
                    .map(card => card.competenceId)
            });
        }
        // Check for learning plateau (low practice frequency)
        const recentlyPracticedCards = cards.filter(card => {
            if (!card.lastReview)
                return false;
            const daysSinceLastReview = (now.getTime() - new Date(card.lastReview).getTime()) /
                (1000 * 60 * 60 * 24);
            return daysSinceLastReview <= this.RECENT_PRACTICE_DAYS;
        });
        if (recentlyPracticedCards.length < cards.length * this.MIN_PRACTICE_RATE) {
            recommendations.push({
                action: "Increase study frequency",
                reason: "Regular practice helps maintain learning progress"
            });
        }
        return recommendations;
    }
}
exports.SuperMemoService = SuperMemoService;
// Algorithm constants - adjusted for young learners
SuperMemoService.MIN_EASINESS_FACTOR = 1.3;
SuperMemoService.MAX_EASINESS_FACTOR = 2.5;
SuperMemoService.INITIAL_EASINESS_FACTOR = 2.5;
SuperMemoService.INITIAL_INTERVAL = 1; // Start with 1 day
SuperMemoService.SECOND_INTERVAL = 6; // Second review after 6 days
// Quality scoring constants
SuperMemoService.QUALITY_SCORING = {
    CORRECT_BASE: 3,
    INCORRECT_WITH_HINTS: 1,
    INCORRECT_MANY_HINTS: 0.5,
    TIME_GOOD_MIN: 0.5,
    TIME_GOOD_MAX: 2.0,
    TIME_OK_MAX: 3.0,
    TIME_GOOD_SCORE: 1,
    TIME_OK_SCORE: 0.5,
    HINTS_NONE_SCORE: 1,
    HINTS_REASONABLE_SCORE: 0.5,
    HINTS_REASONABLE_MAX: 2,
    CONFIDENCE_MAX: 5,
    CONFIDENCE_BONUS_MULTIPLIER: 0.5
};
// Algorithm constants
SuperMemoService.QUALITY_THRESHOLD = 2.5; // Lower threshold for young learners
SuperMemoService.EASINESS_PENALTY = 0.15; // Smaller penalty than standard SM-2
SuperMemoService.EASINESS_SUCCESS_FORMULA_BASE = 0.1;
SuperMemoService.EASINESS_SUCCESS_FORMULA_1 = 0.08;
SuperMemoService.EASINESS_SUCCESS_FORMULA_2 = 0.02;
// Interval limit constants for young learners (in days)
SuperMemoService.MAX_INTERVALS = {
    BEGINNER: 3, // First few repetitions (repetitionNumber <= 2)
    ELEMENTARY: 7, // Early learning stage (3-4 repetitions)
    INTERMEDIATE: 14, // Developing mastery (5-8 repetitions)
    ADVANCED: 30 // Well-learned content (9+ repetitions)
};
// Difficulty level thresholds
SuperMemoService.EASINESS_THRESHOLDS = {
    EASY: 2.3,
    MEDIUM: 2.0,
    HARD: 1.6
};
// Study schedule constants
SuperMemoService.DEFAULT_MAX_CARDS_PER_DAY = 10;
SuperMemoService.SCHEDULE_DAYS = 7;
// Progress analysis thresholds
SuperMemoService.MASTERED_THRESHOLD = {
    EASINESS_FACTOR: 2.2,
    MIN_REPETITIONS: 3
};
SuperMemoService.DIFFICULT_THRESHOLD = 1.6;
SuperMemoService.SUCCESS_THRESHOLD = {
    EASINESS_FACTOR: 2.0,
    QUALITY: 3
};
// Recommendation thresholds
SuperMemoService.REVIEW_OVERLOAD_THRESHOLD = 15;
SuperMemoService.RECENT_PRACTICE_DAYS = 7;
SuperMemoService.MIN_PRACTICE_RATE = 0.3;
SuperMemoService.MAX_RECOMMENDATIONS_TO_RETURN = 10;
