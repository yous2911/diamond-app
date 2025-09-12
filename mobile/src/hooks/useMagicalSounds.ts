// Mock implementation for useMagicalSounds hook
export const useMagicalSounds = () => {
    const playSparkleSound = () => {
        console.log('Playing sparkle sound...');
    };

    const playLevelUpFanfare = () => {
        console.log('Playing level up fanfare...');
    };

    return {
        playSparkleSound,
        playLevelUpFanfare,
    };
};
