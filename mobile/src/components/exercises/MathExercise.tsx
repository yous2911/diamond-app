import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MathExercise as MathExerciseType } from '../../types/exercise';
import Input from '../common/Input';
import Button from '../common/Button';
import useExerciseStore from '../../store/exerciseStore';

interface MathExerciseProps {
  exercise: MathExerciseType;
}

const MathExercise: React.FC<MathExerciseProps> = ({ exercise }) => {
  const [answer, setAnswer] = React.useState('');
  const { submitAnswer, userAnswer, isCorrect } = useExerciseStore();

  const handleSubmit = () => {
    submitAnswer(answer);
  };

  const renderFeedback = () => {
    if (isCorrect === null) return null;

    return isCorrect ? (
      <Text style={styles.correct}>Correct! 🎉</Text>
    ) : (
      <Text style={styles.incorrect}>Not quite, try again!</Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{exercise.question}</Text>
      <Input
        placeholder="Your answer"
        value={answer}
        onChangeText={setAnswer}
        keyboardType="number-pad"
        style={styles.input}
        editable={isCorrect === null}
      />
      {userAnswer === null ? (
        <Button title="Submit" onPress={handleSubmit} />
      ) : (
        renderFeedback()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  question: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    textAlign: 'center',
    fontSize: 24,
  },
  correct: {
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
    marginTop: 20,
  },
  incorrect: {
    fontSize: 24,
    color: 'red',
    fontWeight: 'bold',
    marginTop: 20,
  },
});

export default MathExercise;
