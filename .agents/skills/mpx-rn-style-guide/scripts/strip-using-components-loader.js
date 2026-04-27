'use strict'

function removeUsingComponents (source) {
  const re = /(["']?)usingComponents\1\s*:\s*\{/g
  let out = source
  let match
  let guard = 0
  while ((match = re.exec(out)) !== null) {
    if (guard++ > 50) break
    const startBrace = match.index + match[0].length - 1
    let depth = 1
    let i = startBrace + 1
    let inStr = null
    while (i < out.length && depth > 0) {
      const c = out[i]
      if (inStr) {
        if (c === '\\') { i += 2; continue }
        if (c === inStr) inStr = null
      } else if (c === '"' || c === '\'') {
        inStr = c
      } else if (c === '{') {
        depth++
      } else if (c === '}') {
        depth--
      }
      i++
    }
    if (depth === 0) {
      out = out.slice(0, startBrace) + '{}' + out.slice(i)
      re.lastIndex = startBrace + 2
    } else {
      break
    }
  }
  return out
}

module.exports = function stripUsingComponentsLoader (source) {
  const callback = this.async()
  try {
    callback(null, removeUsingComponents(source))
  } catch (err) {
    callback(err)
  }
}

module.exports.removeUsingComponents = removeUsingComponents
