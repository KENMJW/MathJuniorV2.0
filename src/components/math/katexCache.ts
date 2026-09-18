/**
 * 全局 LRU 缓存管理器 (容量 1000)
 * 满足设计文档 §6.2 与 Property 4 (LRU 缓存一致性与容量约束)
 */

export const MAX_CACHE_SIZE = 1000;

export class LruCache<K, V> {
  private readonly maxSize: number;
  private readonly cache: Map<K, V>;

  constructor(maxSize: number = MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
    this.cache = new Map<K, V>();
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const val = this.cache.get(key)!;
    // 刷新近期访问顺序
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 淘汰最久未访问的条目 (Map 第一个 key)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public has(key: K): boolean {
    return this.cache.has(key);
  }

  public size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}

/** 全局单例数学渲染 LRU 缓存 */
export const katexRenderCache = new LruCache<string, string>(MAX_CACHE_SIZE);
