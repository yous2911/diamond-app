import React from 'react';
import { Volume2 } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';

interface AudioExerciseWrapperProps {
  children: React.ReactNode;
  exercise: {
    audioUrl?: string | null;
    audioQuestionUrl?: string | null;
    audioFeedbackUrl?: string | null;
    titre?: string;
  };
  showQuestionAudio?: boolean;
  showFeedbackAudio?: boolean;
  className?: string;
}

/**
 * Wrapper component that adds audio support to any exercise
 * Displays audio buttons for question, main content, and feedback
 */
export const AudioExerciseWrapper: React.FC<AudioExerciseWrapperProps> = ({
  children,
  exercise,
  showQuestionAudio = true,
  showFeedbackAudio = true,
  className = '',
}) => {
  const hasAudio = exercise.audioUrl || exercise.audioQuestionUrl || exercise.audioFeedbackUrl;

  if (!hasAudio) {
    return <>{children}</>;
  }

  return (
    <div className={`audio-exercise-wrapper ${className}`}>
      {/* Question Audio (if available) */}
      {showQuestionAudio && exercise.audioQuestionUrl && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              Écouter la question
            </span>
          </div>
          <AudioPlayer
            src={exercise.audioQuestionUrl}
            showControls={true}
            className="bg-white"
          />
        </div>
      )}

      {/* Main Exercise Content */}
      <div className="exercise-content">
        {children}
      </div>

      {/* Main Audio (if available and no question audio) */}
      {!exercise.audioQuestionUrl && exercise.audioUrl && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">
              Écouter l&apos;exercice
            </span>
          </div>
          <AudioPlayer
            src={exercise.audioUrl}
            showControls={true}
            className="bg-white"
          />
        </div>
      )}

      {/* Feedback Audio (shown after submission) */}
      {showFeedbackAudio && exercise.audioFeedbackUrl && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 hidden" id="feedback-audio-container">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              Écouter le feedback
            </span>
          </div>
          <AudioPlayer
            src={exercise.audioFeedbackUrl}
            showControls={true}
            autoPlay={true}
            className="bg-white"
          />
        </div>
      )}
    </div>
  );
};

export default AudioExerciseWrapper;

