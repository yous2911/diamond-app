/**
 * Offline Storage Service
 * Manages IndexedDB for caching exercises, progress, and other data
 */

const DB_NAME = 'reved_offline_db';
const DB_VERSION = 1;

interface OfflineData {
  exercises: Map<number, any>;
  competences: Map<number, any>;
  studentProgress: any;
  studentProfile: any;
  mascot: any;
  wardrobe: any[];
  lastSync: Date;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Exercises store with SuperMemo metadata
        if (!db.objectStoreNames.contains('exercises')) {
          const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
          exerciseStore.createIndex('competenceId', 'competenceId', { unique: false });
          exerciseStore.createIndex('level', 'level', { unique: false });
          exerciseStore.createIndex('studentId', 'studentId', { unique: false });
          exerciseStore.createIndex('nextReviewDate', 'superMemo.nextReviewDate', { unique: false });
          exerciseStore.createIndex('cacheUntil', 'cacheUntil', { unique: false });
        }

        // Competences store
        if (!db.objectStoreNames.contains('competences')) {
          db.createObjectStore('competences', { keyPath: 'id' });
        }

        // Student data store
        if (!db.objectStoreNames.contains('studentData')) {
          db.createObjectStore('studentData', { keyPath: 'key' });
        }

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('studentId', 'studentId', { unique: false });
        }

        // Offline queue store
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // Exercises caching with SuperMemo metadata
  // IMPORTANT: Includes all fields needed for animations (configuration, contenu, etc.)
  async cacheExercises(exercises: any[], studentId: number, superMemoData?: Map<number, {
    nextReviewDate: Date;
    easinessFactor: number;
    repetitionNumber: number;
    priority: string;
  }>): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['exercises'], 'readwrite');
    const store = transaction.objectStore('exercises');

    const now = new Date();
    const cacheWindowDays = 7; // Cache exercises due in next 7 days
    const cacheUntil = new Date(now.getTime() + cacheWindowDays * 24 * 60 * 60 * 1000);

    await Promise.all(
      exercises.map(exercise => {
        const superMemo = superMemoData?.get(exercise.id);
        
        // Ensure all animation-required fields are included
        const exerciseWithMetadata = {
          // Core exercise data
          id: exercise.id,
          titre: exercise.titre,
          description: exercise.description,
          matiere: exercise.matiere,
          niveau: exercise.niveau,
          difficulte: exercise.difficulte,
          competenceCode: exercise.competenceCode,
          typeExercice: exercise.typeExercice,
          
          // Animation-required fields
          configuration: exercise.configuration || exercise.config || {}, // For division, drag-drop, etc.
          contenu: exercise.contenu || exercise.content || {}, // Exercise content
          solution: exercise.solution || {}, // Solution data
          metadonnees: exercise.metadonnees || exercise.metadata || {}, // Additional metadata
          
          // Options and hints
          options: exercise.options || exercise.reponses || [],
          hintsText: exercise.hintsText || exercise.hints || [],
          hintsAvailable: exercise.hintsAvailable || 0,
          
          // Rewards and timing
          xp: exercise.xp || exercise.xpReward || 10,
          pointsRecompense: exercise.pointsRecompense || 10,
          tempsEstime: exercise.tempsEstime || exercise.timeLimit || 300,
          
          // Cache metadata
          studentId,
          cachedAt: now.toISOString(),
          cacheUntil: cacheUntil.toISOString(),
          
          // SuperMemo metadata
          superMemo: superMemo ? {
            nextReviewDate: superMemo.nextReviewDate.toISOString(),
            easinessFactor: superMemo.easinessFactor,
            repetitionNumber: superMemo.repetitionNumber,
            priority: superMemo.priority,
          } : null,
        };

        return new Promise<void>((resolve, reject) => {
          const request = store.put(exerciseWithMetadata);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }

  async getCachedExercises(
    studentId: number,
    competenceId?: number,
    level?: string
  ): Promise<any[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['exercises'], 'readonly');
    const store = transaction.objectStore('exercises');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const now = new Date();
        let exercises = request.result || [];
        
        // Filter by student and cache validity
        exercises = exercises.filter((e: any) => {
          // Only return exercises cached for this student
          if (e.studentId !== studentId) return false;
          
          // Check if cache is still valid
          if (e.cacheUntil) {
            const cacheUntil = new Date(e.cacheUntil);
            if (cacheUntil < now) return false; // Cache expired
          }
          
          // Filter by SuperMemo: only return exercises due for review (today or overdue)
          if (e.superMemo?.nextReviewDate) {
            const nextReview = new Date(e.superMemo.nextReviewDate);
            nextReview.setHours(0, 0, 0, 0);
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            // Include exercises due today or in the past (overdue)
            if (nextReview > today) return false;
          } else {
            // If no SuperMemo data, include it (might be a new exercise)
            // But prioritize exercises with SuperMemo data
          }
          
          return true;
        });
        
        // Sort by SuperMemo priority and nextReviewDate
        exercises.sort((a: any, b: any) => {
          if (a.superMemo && b.superMemo) {
            // Priority order: high > medium > normal
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, normal: 2 };
            const priorityDiff = (priorityOrder[a.superMemo.priority] || 2) - 
                                 (priorityOrder[b.superMemo.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by nextReviewDate (earlier = higher priority)
            const dateA = new Date(a.superMemo.nextReviewDate).getTime();
            const dateB = new Date(b.superMemo.nextReviewDate).getTime();
            return dateA - dateB;
          }
          return 0;
        });
        
        if (competenceId) {
          exercises = exercises.filter((e: any) => e.competenceId === competenceId);
        }
        if (level) {
          exercises = exercises.filter((e: any) => e.level === level);
        }
        
        resolve(exercises);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedExercise(exerciseId: number, studentId: number): Promise<any | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['exercises'], 'readonly');
    const store = transaction.objectStore('exercises');

    return new Promise((resolve, reject) => {
      const request = store.get(exerciseId);
      request.onsuccess = () => {
        const exercise = request.result;
        if (!exercise) {
          resolve(null);
          return;
        }
        
        // Check if exercise is cached for this student
        if (exercise.studentId !== studentId) {
          resolve(null);
          return;
        }
        
        // Check cache validity
        if (exercise.cacheUntil) {
          const cacheUntil = new Date(exercise.cacheUntil);
          if (cacheUntil < new Date()) {
            resolve(null); // Cache expired
            return;
          }
        }
        
        resolve(exercise);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Competences caching
  async cacheCompetences(competences: any[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['competences'], 'readwrite');
    const store = transaction.objectStore('competences');

    await Promise.all(
      competences.map(competence => 
        new Promise<void>((resolve, reject) => {
          const request = store.put(competence);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      )
    );
  }

  async getCachedCompetences(): Promise<any[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['competences'], 'readonly');
    const store = transaction.objectStore('competences');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Student data caching
  async cacheStudentData(key: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['studentData'], 'readwrite');
    const store = transaction.objectStore('studentData');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, data, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedStudentData(key: string): Promise<any | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['studentData'], 'readonly');
    const store = transaction.objectStore('studentData');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Progress caching
  async cacheProgress(progress: any[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');

    await Promise.all(
      progress.map(p => 
        new Promise<void>((resolve, reject) => {
          const request = store.put(p);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      )
    );
  }

  async getCachedProgress(): Promise<any[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['progress'], 'readonly');
    const store = transaction.objectStore('progress');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear cache
  async clearCache(): Promise<void> {
    const db = await this.ensureDB();
    const stores = ['exercises', 'competences', 'studentData', 'progress'];
    
    await Promise.all(
      stores.map(storeName => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;

