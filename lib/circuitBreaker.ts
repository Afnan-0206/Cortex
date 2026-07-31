/**
 * Cortex Circuit Breaker & Resiliency System
 *
 * Protects the application from cascading failures, thread/connection exhaustion,
 * and slow external dependencies (Supabase, Edge Functions, External APIs).
 *
 * States:
 * - CLOSED: Normal operation. Requests pass through to dependency.
 * - OPEN: Dependency is failing or timed out. Fast-fails immediately or returns fallback.
 * - HALF_OPEN: Trial period. Allows limited concurrent requests to test recovery.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions<T> {
  name: string;
  failureThreshold?: number;   // Number of consecutive failures before tripping OPEN (default: 3)
  timeoutMs?: number;          // Request timeout threshold in ms (default: 3000ms)
  resetTimeoutMs?: number;     // Time in ms before attempting recovery in HALF_OPEN (default: 5000ms)
  maxConcurrent?: number;       // Concurrency limit to external dependency (default: 5)
  fallback?: () => Promise<T> | T; // Fast-fail fallback value or generator
}

export class CircuitBreaker<T> {
  private name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private failureThreshold: number;
  private timeoutMs: number;
  private resetTimeoutMs: number;
  private maxConcurrent: number;
  private activeCount: number = 0;
  private nextAttemptTime: number = 0;
  private fallback?: () => Promise<T> | T;

  constructor(options: CircuitBreakerOptions<T>) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
    this.maxConcurrent = options.maxConcurrent ?? 5;
    this.fallback = options.fallback;
  }

  public getState(): CircuitState {
    // Transition from OPEN to HALF_OPEN after resetTimeoutMs
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN';
      this.failureCount = 0;
      this.successCount = 0;
    }
    return this.state;
  }

  public async execute(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    // 1. Fast-fail if Circuit is OPEN
    if (currentState === 'OPEN') {
      console.warn(`[CircuitBreaker:${this.name}] OPEN! Fast-failing request.`);
      if (this.fallback) {
        return this.fallback();
      }
      throw new Error(`CircuitBreaker:${this.name} is OPEN`);
    }

    // 2. Concurrency Limiting to avoid connection pool exhaustion
    if (this.activeCount >= this.maxConcurrent) {
      console.warn(`[CircuitBreaker:${this.name}] Max concurrency limit (${this.maxConcurrent}) reached.`);
      if (this.fallback) {
        return this.fallback();
      }
      throw new Error(`CircuitBreaker:${this.name} concurrency limit exceeded`);
    }

    this.activeCount++;

    try {
      // 3. Execute with Timeout Protection
      const result = await this.executeWithTimeout(action, this.timeoutMs);
      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      if (this.fallback) {
        return this.fallback();
      }
      throw err;
    } finally {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  private async executeWithTimeout(action: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      action()
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'CLOSED';
        console.log(`[CircuitBreaker:${this.name}] Recovered! Circuit closed.`);
      }
    }
  }

  private onFailure(err: any) {
    this.failureCount++;
    console.warn(`[CircuitBreaker:${this.name}] Failure #${this.failureCount}:`, err.message || err);

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
      console.error(`[CircuitBreaker:${this.name}] Tripped to OPEN state for ${this.resetTimeoutMs}ms`);
    }
  }
}
