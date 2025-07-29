export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestItem?: string;
  newestItem?: string;
}


export class DataCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    if (this.cache.size >= this.maxSize) {
      
      let oldestKey: string | undefined;
      let oldestTimestamp = Date.now();
      
      for (const [k, item] of this.cache.entries()) {
        if (item.timestamp < oldestTimestamp) {
          oldestKey = k;
          oldestTimestamp = item.timestamp;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
  }

  setMultiple(items: Array<{key: string; data: T; ttl?: number}>): void {
    items.forEach(({key, data, ttl}) => {
      this.set(key, data, ttl);
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return item.data;
  }

  getMultiple(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    keys.forEach(key => {
      result.set(key, this.get(key));
    });
    return result;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deleteMultiple(keys: string[]): number {
    let deletedCount = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }

  deleteByPattern(pattern: RegExp): string[] {
    const deletedKeys: string[] = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedKeys.push(key);
      }
    }
    return deletedKeys;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  clearExpired(): string[] {
    const deletedKeys: string[] = [];
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
        deletedKeys.push(key);
      }
    }
    
    return deletedKeys;
  }

  private isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() > item.timestamp + item.ttl;
  }

  getStats(): CacheStats {
    let oldestKey: string | undefined;
    let newestKey: string | undefined;
    let oldestTime = Date.now();
    let newestTime = 0;
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      totalSize += this.estimateSize(item.data);
      
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
      
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
        newestKey = key;
      }
    }

    const totalAccesses = this.hitCount + this.missCount;
    const hitRate = totalAccesses > 0 ? this.hitCount / totalAccesses : 0;

    return {
      totalItems: this.cache.size,
      totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      oldestItem: oldestKey,
      newestItem: newestKey,
    };
  }

  private estimateSize(data: any): number {
    // Simple size estimation in bytes
    try {
      const jsonString = JSON.stringify(data);
      return new TextEncoder().encode(jsonString).length;
    } catch (e) {
      // Fallback for non-serializable data
      return 0;
    }
  }


  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getAll(): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now <= item.timestamp + item.ttl) {
        result[key] = item.data;
      }
    }

    return result;
  }


  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.keys().length;
  }
}


export const orderBookCache = new DataCache<{
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}>(50, 10 * 60 * 1000); 

setInterval(() => {
  orderBookCache.cleanup();
}, 5 * 60 * 1000); 



export const priceCache = new DataCache<number>();