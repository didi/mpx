declare module 'lru-cache' {
  class LruCache {
    constructor(cache: number);

    get(cacheKey: string): T;

    set(cacheKey: string, content: string): void;
  }
  export default LruCache
}
type preProcessDefsOptType = {
  [k: string]: any;
  __mpx_mode__: string;
  __mpx_src_mode__: string;
  __mpx_env__: string;
}
declare module '@mpxjs/utils/index' {
  export function preProcessDefs(option: Record<string, unknown> | undefined): any {
  }
}
