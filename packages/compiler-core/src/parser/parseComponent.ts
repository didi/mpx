import { makeMap } from '../shared'
import { baseParse } from './parser'
import { ASTAttr } from './types'

const splitRE = /\r?\n/g
const replaceRE = /./g
const isSpecialTag = makeMap('script,style,template,json', true)

export interface SFCParserOptions {
  /** 文件路径 */
  filePath?: string
  /** 小程序平台 & web */
  mode?: 'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'jd' | 'dd' | 'qa' | 'web'
  /** 控制解析后非模板部分的填充方式 */
  pad?: boolean | 'line' | 'space'
  /**  */
  env?: string
}

export interface SFCDescriptor {
  template: SFCBlock | null
  script: SFCBlock | null
  json: SFCBlock | null
  styles: SFCBlock[]
  customBlocks: SFCBlock[]
}

export interface SFCBlock {
  content: string
  attrs: { [key: string]: string | true }
  start: number
  end?: number
  env?: string
  src?: string
  tag?: string
  type?: string
  lang?: string
  mode?: string
  name?: string
  setup?: boolean
  scoped?: boolean
  priority?: number
  useJSONJS?: boolean
}

/**
 * Parse a single-file component (*.mpx) file into an SFC Descriptor Object.
 */
export function parseComponent (
  input: string,
  options: SFCParserOptions = {}
): SFCDescriptor {
  console.log('[parseComponent]', input, options)

  const mode = options.mode || 'wx'
  const env = options.env
  // const filePath = options.filePath

  const sfc: SFCDescriptor = {
    template: null,
    script: null,
    json: null,
    styles: [] as SFCBlock[],
    customBlocks: [] as SFCBlock[],
  }
  let depth = 0
  let currentBlock: null | SFCBlock = null

  function start (
    tag: string,
    attrs: ASTAttr[],
    unary: boolean,
    start: number,
    end: number
  ) {
    if (depth === 0) {
      currentBlock = {
        tag,
        content: '',
        start: end,
        attrs: attrs.reduce(function (cumulated: any, ref) {
          const name = ref.name
          const value = ref.value
          cumulated[name] = value || true
          return cumulated
        }, {}),
      }
      if (isSpecialTag(tag as keyof SFCDescriptor)) {
        checkAttrs(currentBlock, attrs)
        // 带mode的fields只有匹配当前编译mode才会编译
        if (tag === 'style') {
          if (currentBlock.mode && currentBlock.env) {
            if (currentBlock.mode === mode && currentBlock.env === env) {
              sfc.styles.push(currentBlock)
            }
          } else if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              sfc.styles.push(currentBlock)
            }
          } else if (currentBlock.env) {
            if (currentBlock.env === env) {
              sfc.styles.push(currentBlock)
            }
          } else {
            sfc.styles.push(currentBlock)
          }
        } else {
          if (tag === 'script') {
            // 支持type写为application\/json5
            if (
              /^application\/json/.test(currentBlock.type!) ||
              currentBlock.name === 'json'
            ) {
              tag = 'json'
            }
            if (currentBlock.name === 'json') {
              currentBlock.useJSONJS = true
            }
          }
          if (currentBlock.mode && currentBlock.env) {
            if (currentBlock.mode === mode && currentBlock.env === env) {
              currentBlock.priority = 4
            }
          } else if (currentBlock.mode) {
            if (currentBlock.mode === mode) {
              currentBlock.priority = 3
            }
          } else if (currentBlock.env) {
            if (currentBlock.env === env) {
              currentBlock.priority = 2
            }
          } else {
            currentBlock.priority = 1
          }
          if (currentBlock.priority) {
            // @ts-expect-error ignore
            if (!sfc[tag] || sfc[tag].priority <= currentBlock.priority) {
              // @ts-expect-error ignore
              sfc[tag] = currentBlock
            }
          }
        }
      } else {
        // custom blocks
        sfc.customBlocks.push(currentBlock)
      }
    }
    if (!unary) {
      depth++
    }
  }

  function checkAttrs (block: SFCBlock, attrs: ASTAttr[]) {
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i]
      if (attr.name === 'lang') {
        block.lang = attr.value
      }
      if (attr.name === 'type') {
        block.type = attr.value
      }
      if (attr.name === 'scoped') {
        block.scoped = true
      }
      if (attr.name === 'src') {
        block.src = attr.value
      }
      if (attr.name === 'mode') {
        block.mode = attr.value
      }
      if (attr.name === 'name') {
        block.name = attr.value
      }
      if (attr.name === 'env') {
        block.env = attr.value
      }
      if (attr.name === 'setup') {
        block.setup = true
      }
    }
  }

  function end (tag: string, start: number) {
    if (depth === 1 && currentBlock) {
      currentBlock.end = start
      let text = input.slice(currentBlock.start, currentBlock.end)
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      if (options.pad) {
        text = padContent(currentBlock, options.pad) + text
      }
      currentBlock.content = text
      currentBlock = null
    }
    depth--
  }

  function padContent (block: SFCBlock, pad: SFCParserOptions['pad']) {
    if (pad === 'space') {
      return input.slice(0, block.start).replace(replaceRE, ' ')
    } else {
      const offset = input.slice(0, block.start).split(splitRE).length
      const padChar = '\n'
      return Array(offset).join(padChar)
    }
  }

  baseParse(input, {
    start: start,
    end: end,
  })

  return sfc
}
