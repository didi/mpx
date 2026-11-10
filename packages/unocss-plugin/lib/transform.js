import MagicString from 'magic-string'
import transformerDirectives from '@unocss/transformer-directives' // default
import { getReplaceSource } from './source.js'
const escapedReg = /\\(.)/g
const mpEscapeMap = {
  '(': '_pl_',
  ')': '_pr_',
  '[': '_bl_',
  ']': '_br_',
  '{': '_cl_',
  '}': '_cr_',
  '#': '_h_',
  '!': '_i_',
  '/': '_s_',
  '.': '_d_',
  ':': '_c_',
  ',': '_2c_',
  '%': '_p_',
  '\'': '_q_',
  '"': '_dq_',
  '+': '_a_',
  $: '_si_'
}

function mpEscape (str, onUnknown) {
  return str.replace(escapedReg, (_, p1) => {
    if (mpEscapeMap[p1]) return mpEscapeMap[p1]
    onUnknown && onUnknown(p1)
    // unknown escaped
    return '_u_'
  })
}

function escapeKey (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAliasTransformer (alias) {
  if (!alias || !Object.keys(alias).length) {
    return s => getReplaceSource(s)
  }

  const keys = Object.keys(alias).sort((a, b) => b.length - a.length).map(i => escapeKey(i)).join('|')
  const regexText = `\\*(?:${keys})(?<=[^w-])`
  const regex = new RegExp(regexText, 'g')
  return function transformAlias (source) {
    source = getReplaceSource(source)
    const content = source.original().source()
    let match
    regex.lastIndex = 0
    while (match = regex.exec(content)) {
      const start = match.index
      const end = start + match[0].length - 1
      const name = content.slice(start + 1, end + 1)
      const replacement = alias[name]
      source.replace(start, end, replacement)
    }
    return source
  }
}
const regexCache = {}
function makeRegexClassGroup (separators = ['-', ':']) {
  const key = separators.join('|')
  if (!regexCache[key]) regexCache[key] = new RegExp(`((?:[!@<~\\w+:_/-]|\\[&?>?:?\\S*\\])+?)(${key})\\(((?:[~!<>\\w\\s:/\\\\,%#.$?-]|\\[.*?\\])+?)\\)(?!\\s*?=>)`, 'gm')
  regexCache[key].lastIndex = 0
  return regexCache[key]
}

function transformGroups (source, options = {}) {
  source = getReplaceSource(source)
  const content = source.original().source()
  let match
  const groupReg = makeRegexClassGroup(options.separators)
  while (match = groupReg.exec(content)) {
    const start = match.index
    const [text, a, spread, b] = match
    const end = start + text.length - 1
    const replacement = b.split(/\s+/g).filter(Boolean).map(i => i.replace(/^(!?)(.*)/, `$1${a}${spread}$2`)).join(' ')
    source.replace(start, end, replacement)
  }
  return source
}

const hasDirectiveTest = /@(apply|screen|layer)\s/
const hasThemeFunctionTest = /theme\(.*?\)/

function cssRequiresTransform (source, transformCSS) {
  let checkApplyReg
  if (transformCSS) {
    const checkApplyList = transformCSS.applyVariable || ['--at-apply', '--uno-apply', '--uno']
    checkApplyReg = new RegExp(`(${checkApplyList.join('|')})(\\s)?:`)
  }
  return hasDirectiveTest.test(source) || hasThemeFunctionTest.test(source) || (checkApplyReg && checkApplyReg.test(source))
}

async function transformStyle (
  code,
  id,
  uno,
  options
) {
  const s = new MagicString(code)
  await transformerDirectives(options).transform(s, id, { uno })
  if (s.hasChanged()) {
    code = s.toString()
  }
  return code
}

export {
  cssRequiresTransform,
  transformGroups,
  mpEscape,
  transformStyle,
  buildAliasTransformer
}
