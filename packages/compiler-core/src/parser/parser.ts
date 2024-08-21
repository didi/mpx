import { NOOP } from '../shared'
import Tokenizer from './Tokenizer' // 假设 Tokenizer 的路径
import type { ASTAttr } from './types'

const stack: any[] = []

export interface HTMLParserOptions {
  start?: (
    tag: string,
    attrs: ASTAttr[],
    unary: boolean,
    start: number,
    end: number
  ) => void
  end?: (tag: string, start: number, end: number) => void
  chars?: (text: string, start?: number, end?: number) => void
  comment?: (content: string, start: number, end: number) => void
}

export function baseParse (input: string, options: HTMLParserOptions = {}) {
  console.log('[baseParse] input =', input, 'options =', options)

  const tokenizer = new Tokenizer(stack, {
    onerr: NOOP,

    ontext (start, end) {
      console.log('[parseHTML] ontext', start, end)
    },

    ontextentity (char, start, end) {
      console.log('[parseHTML] ontextentity', char, start, end)
    },

    oninterpolation (start, end) {
      console.log('[parseHTML] oninterpolation', start, end)
    },

    onopentagname (start, end) {
      console.log('[parseHTML] onopentagname', start, end)
    },

    onopentagend (end) {
      console.log('[parseHTML] onopentagend', end)
    },

    onclosetag (start, end) {
      console.log('[parseHTML] onclosetag', start, end)
    },

    onselfclosingtag (end) {
      console.log('[parseHTML] onselfclosingtag', end)
    },

    onattribname (start, end) {
      console.log('[parseHTML] onattribname', start, end)
    },

    ondirname (start, end) {
      console.log('[parseHTML] ondirname', start, end)
    },

    ondirarg (start, end) {
      console.log('[parseHTML] ondirarg', start, end)
    },

    ondirmodifier (start, end) {
      console.log('[parseHTML] ondirmodifier', start, end)
    },

    onattribdata (start, end) {
      console.log('[parseHTML] onattribdata', start, end)
    },

    onattribentity (char, start, end) {
      console.log('[parseHTML] onattribentity', char, start, end)
    },

    onattribnameend (end) {
      console.log('[parseHTML] onattribnameend', end)
    },

    onattribend (quote, end) {
      console.log('[parseHTML] onattribend', quote, end)
    },

    oncomment (start, end) {
      console.log('[parseHTML] oncomment', start, end)
    },

    onend () {
      console.log('[parseHTML] onend')
    },

    oncdata (start, end) {
      console.log('[parseHTML] oncdata', start, end)
    },

    onprocessinginstruction (start) {
      console.log('[parseHTML] onprocessinginstruction', start)
    },
  })

  tokenizer.parse(input)
}

// baseParse('<div>Hello World!</div>')
