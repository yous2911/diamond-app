import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface ExerciseCalculProps {
  exercise: any;
  onAnswerChange: (answer: number) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

const ExerciseCalcul: React.FC<ExerciseCalculProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation,
}) => {
  const [inputValue, setInputValue] = useState(currentAnswer?.toString() || '');
  const { operation, question } = exercise.configuration || {};

  const handleInputChange = useCallback(
    (value: string) => {
      const cleanValue = value.replace(/[^0-9]/g, '');
      setInputValue(cleanValue);
      const numericValue = parseFloat(cleanValue);
      if (!isNaN(numericValue)) {
        onAnswerChange(numericValue);
      }
    },
    [onAnswerChange]
  );

  const handleNumberClick = useCallback(
    (num: string) => {
      if (disabled) return;
      if (num === 'C') {
        setInputValue('');
        onAnswerChange(0);
      } else if (num === '⌫') {
        const newValue = inputValue.slice(0, -1);
        setInputValue(newValue);
        const numericValue = parseFloat(newValue);
        onAnswerChange(isNaN(numericValue) ? 0 : numericValue);
      } else {
        const newValue = inputValue + num;
        handleInputChange(newValue);
      }
    },
    [disabled, inputValue, handleInputChange, onAnswerChange]
  );

  const getValidationStyle = () => {
    if (!showValidation) return {};
    const isCorrect = Number(currentAnswer) === Number(exercise.configuration?.resultat);
    return isCorrect ? styles.success : styles.danger;
  };

  const numberPadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question || 'Résous cette opération'}</Text>
      {operation && <Text style={styles.operation}>{operation} = ?</Text>}
      <TextInput
        style={[styles.input, getValidationStyle()]}
        value={inputValue}
        onChangeText={handleInputChange}
        editable={!disabled}
        placeholder="Ta réponse..."
        keyboardType="numeric"
      />
      <View style={styles.numberPad}>
        {numberPadButtons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberPadRow}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={styles.numberPadButton}
                onPress={() => handleNumberClick(btn)}
                disabled={disabled}
              >
                <Text style={styles.numberPadButtonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
    operation: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        padding: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    numberPad: {
        marginTop: 20,
    },
    numberPadRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    numberPadButton: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 40,
    },
    numberPadButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    success: {
        borderColor: '#10B981',
    },
    danger: {
        borderColor: '#EF4444',
    },
});

export default ExerciseCalcul;
