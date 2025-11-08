// =============================================================================
// TYPES FOR INTERACTIVE LONG DIVISION
// =============================================================================

export type DivisionStep = 'setup' | 'estimate' | 'multiply' | 'subtract' | 'bringDown' | 'complete';

export type FeedbackType = 'success' | 'error' | 'hint' | 'info';

export interface Feedback {
  type: FeedbackType;
  message: string;
  id: number;
}

export interface StepHistory {
  estimate: number;
  product: number;
  subtraction: number;
  workingNumber: number;
  position: number;
}

export interface DivisionState {
  dividend: string;
  divisor: string;
  isSetupComplete: boolean;
  currentStep: DivisionStep;
  currentPosition: number;
  quotient: string;
  workingNumber: number;
  finalRest: number;
}

export interface StepInputs {
  userEstimate: string;
  userMultiplication: string;
  userSubtraction: string;
}

export interface DivisionCalculation {
  correctEstimate: number;
  correctProduct: number;
  correctSubtraction: number;
  currentDivisor: number;
}

export interface Explanation {
  title: string;
  content: string;
  tip: string;
  color: string;
}

export interface InteractiveLongDivisionProps {
  onComplete?: (result: { quotient: string; rest: number; dividend: string; divisor: string }) => void;
  onProgress?: (step: DivisionStep, data: any) => void;
  onXPEarned?: (xp: number) => void;
  initialDividend?: string;
  initialDivisor?: string;
}

