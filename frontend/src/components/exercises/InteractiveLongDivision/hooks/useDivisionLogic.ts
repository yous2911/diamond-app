import { useState, useCallback, useMemo } from 'react';
import type { DivisionStep, DivisionState, StepInputs, StepHistory, Feedback, DivisionCalculation } from '../types';

// =============================================================================
// CUSTOM HOOK FOR DIVISION LOGIC
// =============================================================================

export const useDivisionLogic = () => {
  const [state, setState] = useState<DivisionState>({
    dividend: '',
    divisor: '',
    isSetupComplete: false,
    currentStep: 'setup',
    currentPosition: 0,
    quotient: '',
    workingNumber: 0,
    finalRest: 0,
  });

  const [inputs, setInputs] = useState<StepInputs>({
    userEstimate: '',
    userMultiplication: '',
    userSubtraction: '',
  });

  const [stepHistory, setStepHistory] = useState<StepHistory[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Calculate current division values
  const calculations: DivisionCalculation = useMemo(() => {
    const currentDivisor = parseInt(state.divisor) || 0;
    const correctEstimate = state.workingNumber && currentDivisor 
      ? Math.floor(state.workingNumber / currentDivisor) 
      : 0;
    const correctProduct = correctEstimate * currentDivisor;
    const correctSubtraction = state.workingNumber - correctProduct;

    return {
      currentDivisor,
      correctEstimate,
      correctProduct,
      correctSubtraction,
    };
  }, [state.workingNumber, state.divisor]);

  // Initialize division
  const initializeDivision = useCallback(() => {
    if (!state.dividend || !state.divisor) return false;

    const dividendNum = parseInt(state.dividend);
    const divisorNum = parseInt(state.divisor);

    if (dividendNum < divisorNum) {
      return false; // Will trigger feedback
    }

    const dividendStr = state.dividend.toString();
    let initialDigits = dividendStr.substring(0, 1);
    let initialNumber = parseInt(initialDigits);

    // Take enough digits to be >= divisor
    let digitIndex = 1;
    while (initialNumber < divisorNum && digitIndex < dividendStr.length) {
      initialDigits = dividendStr.substring(0, digitIndex + 1);
      initialNumber = parseInt(initialDigits);
      digitIndex++;
    }

    setState(prev => ({
      ...prev,
      isSetupComplete: true,
      currentStep: 'estimate',
      workingNumber: initialNumber,
      currentPosition: initialDigits.length - 1,
      quotient: '',
      finalRest: 0,
    }));

    setStepHistory([]);
    return true;
  }, [state.dividend, state.divisor]);

  // Validate estimate
  const validateEstimate = useCallback((): { success: boolean; error?: string } | null => {
    const estimate = parseInt(inputs.userEstimate);
    if (isNaN(estimate) && estimate !== 0) return null;

    // Check if estimate is too high
    if (estimate * calculations.currentDivisor > state.workingNumber) {
      return { success: false, error: 'too_high' };
    }

    // Check if estimate is too low
    if ((estimate + 1) * calculations.currentDivisor <= state.workingNumber) {
      return { success: false, error: 'too_low' };
    }

    // Correct estimate
    setState(prev => ({
      ...prev,
      quotient: prev.quotient + estimate,
      currentStep: 'multiply',
    }));

    setInputs(prev => ({ ...prev, userEstimate: '', userMultiplication: '' }));
    return { success: true };
  }, [inputs.userEstimate, calculations, state.workingNumber, state.quotient]);

  // Validate multiplication
  const validateMultiplication = useCallback((): { success: boolean; needsDecomposition?: boolean } | null => {
    const product = parseInt(inputs.userMultiplication);
    if (isNaN(product) && product !== 0) return null;

    if (product !== calculations.correctProduct) {
      return { success: false, needsDecomposition: true };
    }

    setState(prev => ({ ...prev, currentStep: 'subtract' }));
    setInputs(prev => ({ ...prev, userMultiplication: '', userSubtraction: '' }));
    return { success: true };
  }, [inputs.userMultiplication, calculations.correctProduct]);

  // Validate subtraction
  const validateSubtraction = useCallback((): { success: boolean } | null => {
    const subtraction = parseInt(inputs.userSubtraction);
    if (isNaN(subtraction) && subtraction !== 0) return null;

    if (subtraction !== calculations.correctSubtraction) {
      return { success: false };
    }

    const newStepHistory: StepHistory = {
      estimate: parseInt(inputs.userEstimate),
      product: calculations.correctProduct,
      subtraction: calculations.correctSubtraction,
      workingNumber: state.workingNumber,
      position: state.currentPosition,
    };

    setStepHistory(prev => [...prev, newStepHistory]);

    const dividendStr = state.dividend.toString();
    if (state.currentPosition + 1 < dividendStr.length) {
      setState(prev => ({ ...prev, currentStep: 'bringDown' }));
    } else {
      setState(prev => ({
        ...prev,
        currentStep: 'complete',
        finalRest: calculations.correctSubtraction,
      }));
    }

    setInputs(prev => ({ ...prev, userSubtraction: '' }));
    return { success: true };
  }, [inputs.userSubtraction, inputs.userEstimate, calculations, state]);

  // Bring down next digit
  const bringDownNext = useCallback((): { newWorkingNumber: number; nextDigit: string } | null => {
    const dividendStr = state.dividend.toString();
    if (state.currentPosition + 1 >= dividendStr.length) {
      return null;
    }

    const nextDigitStr = dividendStr[state.currentPosition + 1];
    const nextDigit = parseInt(nextDigitStr);
    const newWorkingNumber = calculations.correctSubtraction * 10 + nextDigit;

    setState(prev => ({
      ...prev,
      workingNumber: newWorkingNumber,
      currentPosition: prev.currentPosition + 1,
      currentStep: 'estimate',
    }));

    setInputs({
      userEstimate: '',
      userMultiplication: '',
      userSubtraction: '',
    });

    return { newWorkingNumber, nextDigit: nextDigitStr };
  }, [state.dividend, state.currentPosition, calculations.correctSubtraction]);

  // Reset division
  const resetDivision = useCallback(() => {
    setState({
      dividend: '',
      divisor: '',
      isSetupComplete: false,
      currentStep: 'setup',
      currentPosition: 0,
      quotient: '',
      workingNumber: 0,
      finalRest: 0,
    });

    setInputs({
      userEstimate: '',
      userMultiplication: '',
      userSubtraction: '',
    });

    setStepHistory([]);
    setFeedback(null);
  }, []);

  // Update state
  const updateState = useCallback((updates: Partial<DivisionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update inputs
  const updateInputs = useCallback((updates: Partial<StepInputs>) => {
    setInputs(prev => ({ ...prev, ...updates }));
  }, []);

  // Set feedback
  const setFeedbackState = useCallback((newFeedback: Feedback | null) => {
    setFeedback(newFeedback);
  }, []);

  return {
    state,
    inputs,
    stepHistory,
    feedback,
    calculations,
    initializeDivision,
    validateEstimate,
    validateMultiplication,
    validateSubtraction,
    bringDownNext,
    resetDivision,
    updateState,
    updateInputs,
    setFeedbackState,
  };
};

