import { Achievement } from '../types';
import { sendPushNotification } from './notifications';

const achievements: Achievement[] = [
  {
    id: 1,
    achievementCode: 'first_exercise',
    title: 'First Steps',
    description: 'Complete your first exercise.',
    category: 'engagement',
    difficulty: 'bronze',
    xpReward: 10,
    badgeIconUrl: '',
    currentProgress: 0,
    maxProgress: 1,
    isCompleted: false,
  },
  {
    id: 2,
    achievementCode: 'math_whiz',
    title: 'Math Whiz',
    description: 'Complete 10 math exercises.',
    category: 'academic',
    difficulty: 'silver',
    xpReward: 50,
    badgeIconUrl: '',
    currentProgress: 0,
    maxProgress: 10,
    isCompleted: false,
  },
];

export const checkAchievements = async (user: any, exercise: any, expoPushToken: string) => {
  // This is a simplified version. A real implementation would need to
  // get the user's achievements from the API and update them.
  const firstExerciseAchievement = achievements.find(
    (a) => a.achievementCode === 'first_exercise'
  );
  if (firstExerciseAchievement && !firstExerciseAchievement.isCompleted) {
    firstExerciseAchievement.isCompleted = true;
    sendPushNotification(
      expoPushToken,
      'New Achievement Unlocked!',
      `You have unlocked the "${firstExerciseAchievement.title}" achievement.`
    );
  }

  const mathWhizAchievement = achievements.find(
    (a) => a.achievementCode === 'math_whiz'
  );
  if (
    mathWhizAchievement &&
    !mathWhizAchievement.isCompleted &&
    exercise.type === 'CALCUL'
  ) {
    mathWhizAchievement.currentProgress++;
    if (mathWhizAchievement.currentProgress >= mathWhizAchievement.maxProgress) {
      mathWhizAchievement.isCompleted = true;
      sendPushNotification(
        expoPushToken,
        'New Achievement Unlocked!',
        `You have unlocked the "${mathWhizAchievement.title}" achievement.`
      );
    }
  }
};
