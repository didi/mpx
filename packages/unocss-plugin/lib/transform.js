const MagicString = require('magic-string')
const transformerDirectives = require('@unocss/transformer-directives').default
const { getReplaceSource } = require('./source')
const escapedReg = /\\(.)/g

function mpEscape (str, escapeMap = {}) {
  return str.replace(escapedReg, (_, p1) => {
    if (escapeMap[p1]) return escapeMap[p1]
    // unknown escaped
    return escapeMap.unknown
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

const groupReg = /([!\w+-<@][\w+:_/-]*?\w):\(((?:[!\w\s:/\\,%#.$-]|\[.*?\])*?)\)/gm

function transformGroups (source) {
  source = getReplaceSource(source)
  const content = source.original().source()
  let match
  groupReg.lastIndex = 0
  while (match = groupReg.exec(content)) {
    const start = match.index
    const end = start + match[0].length - 1
    const a = match[1]
    const b = match[2]
    const replacement = b.split(/\s+/g).filter(Boolean).map(i => i.replace(/^(!?)(.*)/, `$1${a}:$2`)).join(' ')
    source.replace(start, end, replacement)
  }
  return source
}

const hasDirectiveTest = /@(apply|screen|layer)\s/
const hasThemeFunctionTest = /theme\(.*?\)/

function cssRequiresTransform (source) {
  return hasDirectiveTest.test(source) || hasThemeFunctionTest.test(source)
}

async function transformStyle (
  code,
  id,
  uno
) {
  const s = new MagicString(code)
  await transformerDirectives().transform(s, id, { uno })
  if (s.hasChanged()) {
    code = s.toString()
  }
  return code
}

module.exports = {
  cssRequiresTransform,
  transformGroups,
  mpEscape,
  transformStyle,
  buildAliasTransformer
}
