import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import useExerciseStore from '../../store/exerciseStore';
import { getMathExercise } from '../../services/exerciseService';
import MathExercise from '../../components/exercises/MathExercise';
import Button from '../../components/common/Button';
import { MathExercise as MathExerciseType } from '../../types/exercise';

const ExerciseScreen = () => {
  const { currentExercise, startExercise, nextExercise, userAnswer } = useExerciseStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const loadExercise = async () => {
    setIsLoading(true);
    const exercise = await getMathExercise();
    startExercise(exercise);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!currentExercise) {
      loadExercise();
    }
  }, [currentExercise]);

  const handleNextExercise = () => {
    nextExercise();
    loadExercise();
  };

  if (isLoading || !currentExercise) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {currentExercise.type === 'math' && (
        <MathExercise exercise={currentExercise as MathExerciseType} />
      )}
      {userAnswer !== null && (
        <Button title="Next Exercise" onPress={handleNextExercise} buttonStyle={styles.nextButton} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
  },
  loader: {
    flex: 1,
  },
  nextButton: {
    marginTop: 20,
    width: '80%',
  }
});

export default ExerciseScreen;
