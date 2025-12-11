/**
 * Network Detection Service
 * Detects online/offline status and provides network state management
 */

class NetworkDetector {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Initial check
    this.checkNetworkStatus();
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  private async checkNetworkStatus() {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
    this.notifyListeners(this.isOnline);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

export const networkDetector = new NetworkDetector();
export default networkDetector;

