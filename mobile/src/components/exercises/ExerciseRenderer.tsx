import React from 'react';
import { View, Text } from 'react-native';
import ExerciseQCM from './ExerciseQCM';
import DragDropExercise from './DragDropExercise';
import { Exercise } from '../../types';

interface ExerciseRendererProps {
  exercise: Exercise;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
  onComplete: (isCorrect: boolean) => void;
}

const ExerciseRenderer: React.FC<ExerciseRendererProps> = (props) => {
  const { exercise } = props;

  switch (exercise.type) {
    case 'QCM':
      return <ExerciseQCM {...props} />;
    case 'DRAG_DROP':
      return <DragDropExercise {...props} />;
    default:
      return (
        <View>
          <Text>Unsupported exercise type: {exercise.type}</Text>
        </View>
      );
  }
};

export default ExerciseRenderer;
