declare module 'webpack/lib/InitFragment' {}
declare module 'webpack/lib/util/makeSerializable' {}
declare module 'webpack/lib/dependencies/ModuleDependency' {}
declare module '@mpxjs/utils/parse-request' {}
declare module '@mpxjs/utils/normalize' {}
declare module '@mpxjs/utils/is-url-request' {}
declare module '@mpxjs/utils/match-condition' {}
declare module '@mpxjs/utils/add-infix' {}
declare module '@mpxjs/utils/stringify-query' {}
declare module '@mpxjs/compiler/style-compiler/plugins/vw' {}
declare module '@mpxjs/compiler/style-compiler/plugins/rpx' {}
declare module '@mpxjs/compiler/style-compiler/plugins/trim' {}
declare module '@mpxjs/compiler/style-compiler/plugins/conditional-strip' {}
declare module '@mpxjs/compiler/style-compiler/plugins/scope-id' {}
declare module '@mpxjs/utils/is-empty-object' {}
declare module '@mpxjs/utils/mpx-json' {}
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

declare module '@mpxjs/compiler/template-compiler' {
  import { RawSourceMap } from 'source-map'

  type Mode = 'wx' | 'web' | 'ali' | 'swan'

  export interface SFCBlock {
    tag: 'template' | 'script' | 'style'
    content: string
    result?: string
    start: number
    attrs: { [key: string]: string | true }
    priority?: number
    end: number
    src?: string
    map?: RawSourceMap
  }

  export interface Template extends SFCBlock {
    tag: 'template'
    type: 'template'
    lang?: string
    mode?: Mode
  }

  export interface Script extends SFCBlock {
    tag: 'script'
    type: 'script'
    mode?: Mode
  }

  export interface JSON extends SFCBlock {
    tag: 'script'
    type: 'application/json' | 'json'
    attrs: { type: 'application/json' | 'json' }
    src: string
    useJSONJS: boolean
  }

  export interface Style extends SFCBlock {
    tag: 'style'
    type: 'style'
    scoped?: boolean
  }

  export interface CompilerResult {
    template: Template | null
    script: Script | null
    json: JSON | null
    styles: Style[]
    customBlocks: []
  }

  export interface ParseHtmlNode {
    type: number
    tag: string
    children: ParseHtmlNode[]
  }
  export interface ParseResult {
    meta: {
      builtInComponentsMap?: Record<string, string>
      genericsInfo?: Record<string, unknown>
    }
    root: ParseHtmlNode
  }

  interface Compiler {
    parseComponent(
      template: string,
      options: {
        mode: Mode
        defs?: Record<string, unknown>
        env?: string
        filePath?: string
        pad?: 'line'
        needMap?: boolean
      }
    ): CompilerResult
    parse(
      template: string,
      options: {
        warn: (msg: string) => void
        error: (msg: string) => void
        defs: Record<string, unknown>
        mode: Mode
        srcMode: Mode
        isNative: boolean
        basename: string
        i18n: Record<string, unknown> | null
        decodeHTMLText: boolean
        externalClasses: string[]
        checkUsingComponents: boolean
        usingComponents: string[]
        componentGenerics: Record<string, { default?: string }>
        hasComment: boolean
        isNative: boolean
        isComponent: boolean
        hasScoped: boolean
        moduleId: string
        filePath: string
        globalComponents: string[]
      }
    ): ParseResult
    serialize(root: ParseHtmlNode): string
  }

  declare const compiler: Compiler

  export default compiler
}
