/**
 * Offline Queue Service
 * Manages queue of API requests to be synced when back online
 */

interface QueuedRequest {
  id?: number;
  endpoint: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  priority: 'high' | 'medium' | 'low';
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private maxRetries = 3;
  private isProcessing = false;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadQueueFromStorage();
  }

  private async loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('reved_offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      localStorage.setItem('reved_offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  async addRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<number> {
    const request: QueuedRequest = {
      endpoint,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0,
      priority,
    };

    this.queue.push(request);
    await this.saveQueueToStorage();
    
    return this.queue.length - 1;
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    const results = { success: 0, failed: 0 };

    // Sort by priority and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    const toRemove: number[] = [];

    for (let i = 0; i < this.queue.length; i++) {
      const request = this.queue[i];
      
      try {
        const response = await fetch(`${this.baseURL}${request.endpoint}`, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          results.success++;
          toRemove.push(i);
        } else {
          request.retries++;
          if (request.retries >= this.maxRetries) {
            results.failed++;
            toRemove.push(i);
          }
        }
      } catch (error) {
        request.retries++;
        if (request.retries >= this.maxRetries) {
          results.failed++;
          toRemove.push(i);
        }
      }
    }

    // Remove processed requests (in reverse order to maintain indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.queue.splice(toRemove[i], 1);
    }

    await this.saveQueueToStorage();
    this.isProcessing = false;

    return results;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueueToStorage();
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }
}

export const createOfflineQueue = (baseURL: string) => new OfflineQueue(baseURL);
export default OfflineQueue;

