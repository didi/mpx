const {
  normalizeLoc,
  createCodeFrame,
  originalPositionFor,
  readSource
} = require('../utils/source-location')

function formatAttr (attr) {
  if (!attr) return ''
  if (attr.value === true || attr.value == null) return attr.name
  return `${attr.name}="${attr.value}"`
}

function formatTarget (context, extra) {
  const target = extra && extra.target
  if (target) {
    if (target.kind === 'css-decl') return `${target.prop}: ${target.value}`
    if (target.kind === 'css-atrule') return `@${target.name}${target.params ? ' ' + target.params : ''}`
    if (target.kind === 'selector') return target.value
    if (target.kind === 'event') return target.name
  }
  const input = context && context.input
  const data = context && context.data
  if (data && data.attr) {
    return `<${data.el && data.el.tag}${formatAttr(data.attr) ? ' ' + formatAttr(data.attr) : ''}>`
  }
  if (input && input.prop) {
    return `${input.prop}: ${input.value}`
  }
  if (input && input.selector) {
    return input.selector
  }
  return ''
}

function inferPath (context, extra) {
  if (extra && extra.path) {
    return Array.isArray(extra.path) ? extra.path.join('.') : extra.path
  }
  const data = context && context.data
  const meta = context && context.meta
  if (data && meta && Array.isArray(meta.paths)) {
    const paths = meta.paths.join('|')
    return (data.pathArr || []).concat(paths).filter(Boolean).join('.')
  }
}

function formatValue (value) {
  if (value === undefined) return 'undefined'
  let result
  try {
    result = JSON.stringify(value)
  } catch (e) {
    result = String(value)
  }
  if (result === undefined) result = String(value)
  return result.length > 120 ? result.slice(0, 117) + '...' : result
}

function inferJsonTarget (context, extra) {
  const path = inferPath(context, extra)
  if (!path) return ''
  if (extra && Object.prototype.hasOwnProperty.call(extra, 'value')) {
    return `${path}: ${formatValue(extra.value)}`
  }
  return path
}

function inferLoc (context, extra) {
  if (extra) {
    if (extra.loc) return normalizeLoc(extra.loc)
    if (extra.node && extra.node.source) return normalizeLoc(extra.node.source.start)
    if (extra.decl && extra.decl.source) return normalizeLoc(extra.decl.source.start)
    if (extra.attr) return normalizeLoc(extra.attr.loc)
    if (extra.el) return normalizeLoc(extra.el.loc)
  }
  const input = context && context.input
  const data = context && context.data
  if (data) {
    if (data.attr && data.attr.loc) return normalizeLoc(data.attr.loc)
    if (data.el && data.el.loc) return normalizeLoc(data.el.loc)
  }
  if (input) {
    if (input.decl && input.decl.source) return normalizeLoc(input.decl.source.start)
    if (input.rule && input.rule.source) return normalizeLoc(input.rule.source.start)
    if (input.loc) return normalizeLoc(input.loc)
  }
}

function inferSourceMap (context, extra, base) {
  if (extra && extra.sourceMap) return extra.sourceMap
  if (context && context.input && context.input.sourceMap) return context.input.sourceMap
  return base && base.sourceMap
}

function createDiagnostic ({
  type,
  mode,
  srcMode,
  warn,
  error,
  diagnostic = {}
}) {
  const stack = []
  const file = diagnostic.file
  const source = diagnostic.source
  const inputFileSystem = diagnostic.inputFileSystem

  function withContext (context, fn) {
    stack.push(context)
    try {
      return fn()
    } finally {
      stack.pop()
    }
  }

  function format (msg, extra) {
    msg = msg && msg.message ? msg.message : String(msg)
    const context = stack[stack.length - 1]
    const lines = []
    const loc = inferLoc(context, extra)
    const sourceMap = inferSourceMap(context, extra, diagnostic)
    let finalFile = file
    let finalLoc = loc
    let finalSource = source
    let original
    if (sourceMap && loc) {
      original = originalPositionFor(sourceMap, loc)
      if (original) {
        finalFile = original.file
        finalLoc = original.loc
        finalSource = original.source || readSource(original.file, inputFileSystem)
      }
    }
    const hasLoc = finalLoc && finalLoc.start
    const locText = finalFile && hasLoc
      ? `${finalFile}:${finalLoc.start.line}:${finalLoc.start.column}`
      : ''
    lines.push(msg)
    const target = formatTarget(context, extra) || (type === 'json' ? inferJsonTarget(context, extra) : inferPath(context, extra))
    if (target) lines.push(`Target: ${target}`)
    if (srcMode || mode) lines.push(`Mode: ${srcMode || ''}${srcMode && mode ? ' -> ' : ''}${mode || ''}`)
    const frame = createCodeFrame(finalSource, finalLoc)
    if (frame) {
      lines.push('')
      lines.push(frame)
    }
    return {
      message: lines.join('\n'),
      loc: locText || undefined
    }
  }

  return {
    warn (msg, extra) {
      const result = format(msg, extra)
      warn && warn(result.message, result.loc)
    },
    error (msg, extra) {
      const result = format(msg, extra)
      error && error(result.message, result.loc)
    },
    withContext
  }
}

module.exports = createDiagnostic
