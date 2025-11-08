// =============================================================================
// 📊 ERROR LOGGING SERVICE - CENTRALIZED ERROR HANDLING
// =============================================================================

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  RENDERING = 'rendering',
  API = 'api',
  UNKNOWN = 'unknown'
}

/**
 * Error context information
 */
export interface ErrorContext {
  userId?: string | number;
  userType?: 'student' | 'parent' | 'admin';
  route?: string;
  component?: string;
  action?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}

/**
 * Error log entry
 */
export interface ErrorLog {
  id: string;
  message: string;
  error: Error | string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  stack?: string;
}

/**
 * Error Logger Service
 * Centralized error logging with support for multiple backends
 */
class ErrorLoggerService {
  private errorQueue: ErrorLog[] = [];
  private maxQueueSize = 50;
  private flushInterval: number | null = null;
  private isInitialized = false;

  /**
   * Initialize error logger
   */
  init() {
    if (this.isInitialized) return;

    // Flush errors every 30 seconds
    this.flushInterval = window.setInterval(() => {
      this.flushErrors();
    }, 30000);

    // Flush errors on page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrors(true);
    });

    this.isInitialized = true;
  }

  /**
   * Log an error
   */
  logError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      message: error instanceof Error ? error.message : error,
      error: error instanceof Error ? error.toString() : error,
      severity,
      category,
      context: {
        ...this.getDefaultContext(),
        ...context,
        timestamp: new Date().toISOString()
      },
      stack: error instanceof Error ? error.stack : undefined
    };

    // Add to queue
    this.errorQueue.push(errorLog);

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(errorLog);
    }

    // Immediately flush critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.flushErrors(true);
    }
  }

  /**
   * Log network error
   */
  logNetworkError(
    error: Error,
    url: string,
    method: string = 'GET',
    context: Partial<ErrorContext> = {}
  ): void {
    this.logError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      {
        ...context,
        url,
        action: `${method} ${url}`,
        networkError: true
      }
    );
  }

  /**
   * Log authentication error
   */
  logAuthError(
    error: Error,
    action: string,
    context: Partial<ErrorContext> = {}
  ): void {
    this.logError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION,
      {
        ...context,
        action,
        authError: true
      }
    );
  }

  /**
   * Log rendering error
   */
  logRenderingError(
    error: Error,
    component: string,
    context: Partial<ErrorContext> = {}
  ): void {
    this.logError(
      error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.RENDERING,
      {
        ...context,
        component,
        renderingError: true
      }
    );
  }

  /**
   * Log API error
   */
  logApiError(
    error: Error,
    endpoint: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ): void {
    this.logError(
      error,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      ErrorCategory.API,
      {
        ...context,
        url: endpoint,
        action: `API ${endpoint}`,
        statusCode,
        apiError: true
      }
    );
  }

  /**
   * Get default context
   */
  private getDefaultContext(): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      route: window.location.pathname
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to console (development only)
   */
  private logToConsole(errorLog: ErrorLog): void {
    const emoji = {
      [ErrorSeverity.LOW]: '🔵',
      [ErrorSeverity.MEDIUM]: '🟡',
      [ErrorSeverity.HIGH]: '🟠',
      [ErrorSeverity.CRITICAL]: '🔴'
    }[errorLog.severity];

    console.group(`${emoji} Error [${errorLog.severity.toUpperCase()}] - ${errorLog.category}`);
    console.error('Message:', errorLog.message);
    console.error('Context:', errorLog.context);
    if (errorLog.stack) {
      console.error('Stack:', errorLog.stack);
    }
    console.groupEnd();
  }

  /**
   * Flush errors to backend/logging service
   */
  async flushErrors(immediate: boolean = false): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, send to error logging service
      if (process.env.NODE_ENV === 'production') {
        await this.sendToErrorService(errorsToFlush);
      } else {
        // In development, just log
        console.log(`[ErrorLogger] Flushing ${errorsToFlush.length} errors`);
      }
    } catch (error) {
      // If sending fails, re-add errors to queue (except if immediate)
      if (!immediate) {
        this.errorQueue.unshift(...errorsToFlush);
      }
      console.error('[ErrorLogger] Failed to flush errors:', error);
    }
  }

  /**
   * Send errors to error logging service
   * Supports Sentry, LogRocket, or custom backend
   */
  private async sendToErrorService(errors: ErrorLog[]): Promise<void> {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      errors.forEach(errorLog => {
        (window as any).Sentry.captureException(
          new Error(errorLog.message),
          {
            level: errorLog.severity,
            tags: {
              category: errorLog.category,
              component: errorLog.context.component
            },
            extra: errorLog.context
          }
        );
      });
      return;
    }

    // Check if LogRocket is available
    if (typeof window !== 'undefined' && (window as any).LogRocket) {
      errors.forEach(errorLog => {
        (window as any).LogRocket.captureException(
          new Error(errorLog.message),
          {
            tags: {
              severity: errorLog.severity,
              category: errorLog.category
            },
            extra: errorLog.context
          }
        );
      });
      return;
    }

    // Fallback: Send to custom backend endpoint
    try {
      const response = await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ errors })
      });

      if (!response.ok) {
        throw new Error(`Failed to log errors: ${response.status}`);
      }
    } catch (error) {
      // Silently fail - don't break the app
      console.warn('[ErrorLogger] Failed to send errors to backend:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
  } {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      } as Record<ErrorSeverity, number>,
      byCategory: {
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.RENDERING]: 0,
        [ErrorCategory.API]: 0,
        [ErrorCategory.UNKNOWN]: 0
      } as Record<ErrorCategory, number>
    };

    this.errorQueue.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
    });

    return stats;
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushErrors(true);
    this.isInitialized = false;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggerService();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  errorLogger.init();
}

