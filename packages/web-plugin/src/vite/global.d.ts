declare module '@mpxjs/webpack-plugin/lib/web/processTemplate'
declare module '@mpxjs/webpack-plugin/lib/web/processJSON'
declare module '@mpxjs/webpack-plugin/lib/web/processStyles'
declare module '@mpxjs/webpack-plugin/lib/web/processScript'
declare module '@mpxjs/webpack-plugin/lib/utils/mpx-json'
declare module '@mpxjs/webpack-plugin/lib/parser'
declare module 'rollup-plugin-polyfill-node'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/load-postcss-config'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/plugins/trim'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/plugins/rpx'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/plugins/vw'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/plugins/conditional-strip'
declare module '@mpxjs/webpack-plugin/lib/style-compiler/plugins/scope-id'

declare module '@mpxjs/webpack-plugin/lib/utils/eval-json-js' {
  export default function (
    source: string,
    filename: string,
    loaderContext: {
      getMpx(): { defs: Record<string, unknown> }
      addDependency(id: string): void
      _compiler: {
        inputFileSystem: any
      }
    }
  ): string
}

declare module '@mpxjs/webpack-plugin/lib/utils/to-posix' {
  export default function (path: string): string
}

declare module '@mpxjs/webpack-plugin/lib/utils/gen-component-tag' {
  function genComponentTag<T>(
    part: T,
    processor:
      | {
          tag?: (part: T) => string
          attrs?: (part: T) => Record<string, unknown>
          content?: (part: T) => string
        }
      | ((part: T) => string) = {}
  ): string

  export default genComponentTag
}

declare module '@mpxjs/webpack-plugin/lib/template-compiler/compiler' {
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
