interface CacheContent {
  src: string,
  content: string;
  map?: string;
}
declare module 'lru-cache' {
  class LruCache {
    constructor(cache: number);

    get(cacheKey: string): {
      script: CacheContent,
      styles: Array<CacheContent>
    };

    set(cacheKey: string, content: string): void;
  }
  export default LruCache
}
