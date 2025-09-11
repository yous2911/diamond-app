import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface ExerciseQCMProps {
  exercise: any;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

const ExerciseQCM: React.FC<ExerciseQCMProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const { question, choix = [] } = exercise.configuration || {};

  const getChoiceStyle = (choice: string) => {
    if (showValidation) {
      if (choice === exercise.configuration?.bonneReponse) {
        return styles.success;
      } else if (choice === currentAnswer && choice !== exercise.configuration?.bonneReponse) {
        return styles.danger;
      }
    }

    if (choice === currentAnswer) {
      return styles.primary;
    }

    return styles.default;
  };

  return (
    <View style={styles.container}>
<Text style={styles.question} accessibilityLabel={`Question: ${question}`}>{question}</Text>
      <View style={styles.choicesContainer}>
        {choix.map((choice: string, index: number) => {
          const style = getChoiceStyle(choice);
    const isSelected = currentAnswer === choice;
          return (
            <Animated.View key={index} entering={FadeIn.delay(index * 100)} exiting={FadeOut}>
              <TouchableOpacity
                onPress={() => onAnswerChange(choice)}
                disabled={disabled}
                style={[styles.choice, style]}
          accessibilityLabel={`Choice ${index + 1}: ${choice}`}
          accessibilityState={{ selected: isSelected }}
              >
                <Text style={style === styles.primary || style === styles.success || style === styles.danger ? styles.choiceTextSelected : styles.choiceText}>
                  {choice}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  choicesContainer: {
    alignItems: 'center',
  },
  choice: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
  },
  choiceText: {
    fontSize: 18,
  },
  choiceTextSelected: {
    fontSize: 18,
    color: 'white',
  },
  default: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
  },
  primary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  success: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  danger: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
});

export default ExerciseQCM;
