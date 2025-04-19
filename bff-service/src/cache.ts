import { CacheItem } from './types';

export class Cache<T> {
  private store = new Map<string, CacheItem<T>>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  set(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.store.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.store.clear();
  }
}

export const cacheInstance = new Cache<any>();