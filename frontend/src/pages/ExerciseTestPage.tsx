import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { adaptExercises } from '../utils/exerciseAdapter';

// =============================================================================
// 🧪 EXERCISE TEST PAGE - VERIFY YOUR 462 EXERCISES WORK
// =============================================================================

const ExerciseTestPage: React.FC = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    testExercises();
  }, []);

  const testExercises = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test 1: Get exercises by level
      console.log('🧪 Testing exercises by level...');
      const response = await apiService.getExercisesByLevel('cp', { limit: 5 });
      
      if (response.success && response.data) {
        console.log('✅ Got exercises:', response.data.length);
        setExercises(response.data);
        
        // Test 2: Adapt exercises
        console.log('🔄 Adapting exercises...');
        const adapted = adaptExercises(response.data);
        console.log('✅ Adapted exercises:', adapted);
        
        // Test 3: Get stats
        console.log('📊 Getting exercise stats...');
        const statsResponse = await fetch('http://localhost:3003/api/legacy-exercises/stats/overview');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
          console.log('✅ Exercise stats:', statsData.data);
        }
      } else {
        setError(response.error?.message || 'Failed to fetch exercises');
      }
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🧪 Testing Your 462 Exercises</h1>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Exercise Test Results</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">❌ Error</h2>
            <p>{error}</p>
          </div>
        )}

        {stats && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">📊 Your Exercise Database</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{stats.total}</div>
                <div className="text-sm">Total Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.byLevel.length}</div>
                <div className="text-sm">Grade Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.bySubject.length}</div>
                <div className="text-sm">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.byDifficulty.length}</div>
                <div className="text-sm">Difficulty Levels</div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-bold mb-2">By Grade Level:</h3>
                {stats.byLevel.map((level: any) => (
                  <div key={level.niveau} className="text-sm">
                    {level.niveau.toUpperCase()}: {level.count} exercises
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-bold mb-2">By Subject:</h3>
                {stats.bySubject.map((subject: any) => (
                  <div key={subject.matiere} className="text-sm">
                    {subject.matiere}: {subject.count} exercises
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-bold mb-2">By Difficulty:</h3>
                {stats.byDifficulty.map((diff: any) => (
                  <div key={diff.difficulty_level} className="text-sm">
                    Level {diff.difficulty_level}: {diff.count} exercises
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {exercises.length > 0 && (
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-400 mb-4">🎯 Sample Exercises (CP Level)</h2>
            <div className="space-y-4">
              {exercises.slice(0, 3).map((exercise, index) => {
                const adapted = adaptExercises([exercise])[0];
                return (
                  <div key={exercise.id} className="bg-white/10 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">
                      {index + 1}. {adapted.question}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Subject:</strong> {adapted.subject}
                      </div>
                      <div>
                        <strong>Difficulty:</strong> {adapted.difficulty}
                      </div>
                      <div>
                        <strong>Type:</strong> {adapted.type}
                      </div>
                      <div>
                        <strong>Options:</strong> {adapted.options.length}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Options:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {adapted.options.map((option: string, i: number) => (
                          <li key={i} className={i === adapted.correctAnswer ? 'text-green-400' : ''}>
                            {option} {i === adapted.correctAnswer ? '✅' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={testExercises}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition-colors"
          >
            🔄 Test Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTestPage;

