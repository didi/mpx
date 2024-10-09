declare let global: Record<string, any> // in web, we use global varible to do some things, here to declare

type Dict<T> = {
  [k: string]: T | undefined
}

type EnvType = Dict<string>

declare let process: {
  env: EnvType
}

declare namespace __WebpackModuleApi {
  interface RequireContext {
    keys (): string[];

    (id: string): any;

    <T> (id: string): T;

    resolve (id: string): string;

    /** The module id of the context module. This may be useful for module.hot.accept. */
    id: string;
  }
}

interface Require {
  context (path: string, deep?: boolean, filter?: RegExp, mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once'): __WebpackModuleApi.RequireContext
}
