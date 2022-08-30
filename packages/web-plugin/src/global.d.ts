declare module 'webpack/lib/InitFragment' {}
declare module 'webpack/lib/util/makeSerializable' {}
declare module 'webpack/lib/dependencies/ModuleDependency' {}
declare module '@mpxjs/utils/parse-request' {}
declare module '@mpxjs/utils/normalize' {}
declare module '@mpxjs/utils/is-url-request' {}
declare module '@mpxjs/utils/match-condition' {
  export function matchCondition(...args: any[]): any
}

declare module '@mpxjs/utils/add-infix' {}
declare module '@mpxjs/utils/stringify-query' {}
declare module '@mpxjs/utils/is-empty-object' {}
declare module '@mpxjs/utils/mpx-json' {
  
}

declare module '@mpxjs/compiler/template-compiler/parser' {
  export default function parser(...args: any[]): any
}

declare module '@mpxjs/utils/to-posix' {
  export default function toPosix(path: string): string
}

declare module '@mpxjs/utils/gen-component-tag' {
  export default function genComponentTag<T>(
    part: T,
    processor:
      | {
          tag?: (part: T) => string
          attrs?: (part: T) => Record<string, unknown>
          content?: (part: T) => string
        }
      | ((part: T) => string) = {}
  ): string
}

