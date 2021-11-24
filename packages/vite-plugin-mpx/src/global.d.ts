declare module '@mpxjs/webpack-plugin/lib/web/processTemplate'
declare module '@mpxjs/webpack-plugin/lib/web/processJSON'
declare module '@mpxjs/webpack-plugin/lib/web/processStyles'
declare module '@mpxjs/webpack-plugin/lib/web/processScript'
declare module '@mpxjs/webpack-plugin/lib/utils/mpx-json'
declare module '@mpxjs/webpack-plugin/lib/parser'
declare module 'rollup-plugin-node-globals'

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
    src?: string
    mode?: Mode
    content: string
    result?: string
    start?: number
    attrs: Record<string, unknown>
    priority?: number
    end?: number
  }

  export interface Template extends SFCBlock {
    tag: 'template'
    lang?: string,
    vueContent: string
  }

  export interface Script extends SFCBlock {
    tag: 'script'
    map?: RawSourceMap
  }

  export interface JSON extends SFCBlock {
    tag: 'script'
    attrs: { type: 'application/json' | 'json' }
    type: 'application/json' | 'json'
    src: string
  }

  export interface Style extends SFCBlock {
    tag: 'style'
    map?: RawSourceMap
    scoped?: boolean
  }

  export interface CompilerResult {
    template: Template
    script: Script
    json: JSON
    styles: Style[]
    customBlocks: []
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
    ): unknown
    serialize(root: unknown): string
  }

  declare const compiler: Compiler

  export default compiler
}
