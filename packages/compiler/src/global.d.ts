
declare module 'lru-cache' {
  class LruCache {
    constructor(cache: number);

    get(cacheKey: string): T;

    set(cacheKey: string, content: string): void;
  }
  export default LruCache
}

declare module 'he' {}

declare module 'consolidate' {}