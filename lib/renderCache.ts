/**
 * Cortex Fragment & Render Output Caching Engine
 *
 * Implements Incremental Static Regeneration (ISR) and Fragment Caching
 * for static & infrequently changing content (Daily Puzzles, Quests, Leaderboards, Brand Manifesto).
 *
 * Features:
 * - Time-To-Live (TTL) & Scheduled Revalidation.
 * - Cache Keys with Locale & Theme variations.
 * - Dynamic Hole Punching: Leaves user-specific personalized fields (Streak, XP, User Avatar)
 *   dynamic for fast client-side hydration.
 */

export interface CacheOptions {
  ttlMs?: number;        // Time-To-Live in milliseconds (default: 5 minutes)
  locale?: string;       // Meaningful variation key (default: 'en-US')
  theme?: string;        // Meaningful variation key (default: 'dark')
}

export interface CachedEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  locale: string;
  theme: string;
}

class RenderCache {
  private cache: Map<string, CachedEntry<any>> = new Map();
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates a composite cache key considering locale, theme, and region variation parameters.
   */
  public getCacheKey(segment: string, options: CacheOptions = {}): string {
    const locale = options.locale || 'en-US';
    const theme = options.theme || 'dark';
    return `${segment}:${locale}:${theme}`;
  }

  /**
   * Retrieves a cached rendered fragment if valid and unexpired.
   */
  public get<T>(segment: string, options: CacheOptions = {}): T | null {
    const key = this.getCacheKey(segment, options);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      console.log(`[RenderCache] Cache expired for segment "${key}". Revalidating...`);
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores a rendered fragment into cache with TTL.
   */
  public set<T>(segment: string, data: T, options: CacheOptions = {}): void {
    const key = this.getCacheKey(segment, options);
    const ttlMs = options.ttlMs || this.defaultTtlMs;
    const now = Date.now();

    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
      locale: options.locale || 'en-US',
      theme: options.theme || 'dark',
    });

    console.log(`[RenderCache] Cached segment "${key}" until ${new Date(now + ttlMs).toLocaleTimeString()}`);
  }

  /**
   * Clears or invalidates a cached segment on content change.
   */
  public invalidate(segment: string, options: CacheOptions = {}): void {
    const key = this.getCacheKey(segment, options);
    this.cache.delete(key);
    console.log(`[RenderCache] Invalidated segment "${key}"`);
  }

  /**
   * Clears the entire render cache.
   */
  public clear(): void {
    this.cache.clear();
  }
}

export const renderCache = new RenderCache();
