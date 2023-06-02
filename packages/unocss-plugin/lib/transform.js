const { getReplaceSource } = require('./source')

const escapeMap = {
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
  '2c ': '_2c_',
  '%': '_p_',
  '\'': '_q_',
  '"': '_dq_',
  '+': '_a_',
  '$': '_si_',
}

const escapedReg = /\\(2c\s|.)/g

function mpEscape(str) {
  return str.replace(escapedReg, (_, p1) => {
    if (escapeMap[p1])
      return escapeMap[p1]
    // unknown escaped
    return '_u_'
  })
}

function escapeKey(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAliasTransformer(alias) {
  if (!alias || !Object.keys(alias).length)
    return s => getReplaceSource(s)

  const keys = Object.keys(alias).sort((a, b) => b.length - a.length).map(i => escapeKey(i)).join('|')
  const regexText = `\\*(?:${keys})(?<=[^w-])`
  const regex = new RegExp(regexText, 'g')
  return function transformAlias(source) {
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

function transformGroups(source) {
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

function cssRequiresTransform(source) {
  return hasDirectiveTest.test(source) || hasThemeFunctionTest.test(source)
}

module.exports = {
  cssRequiresTransform,
  transformGroups,
  mpEscape,
  buildAliasTransformer,
}
