'use strict'

const path = require('path')
const { createRequire } = require('module')

function dependency (name, file) {
  const paths = [path.dirname(path.resolve(file)), __dirname]
  try {
    return require(require.resolve(name, { paths }))
  } catch (error) {
    if (name !== '@babel/parser') throw error
    const owner = require.resolve('@babel/core', { paths })
    return createRequire(owner)(name)
  }
}

function blocks (source, file) {
  const compiler = dependency('vue/compiler-sfc', file)
  const result = []
  let remaining = source
  // Vue keeps only the last ordinary script. Reparse after masking selected
  // blocks to retain every Mpx platform variant without changing offsets.
  while (true) {
    const parsed = compiler.parse({ source: remaining, filename: file })
    const selected = [parsed.template, parsed.script, parsed.scriptSetup,
      ...parsed.styles, ...parsed.customBlocks].filter(Boolean)
    if (!selected.length) break
    for (const block of selected) {
      const start = remaining.lastIndexOf('<', block.start - 1)
      const end = remaining.indexOf('>', block.end) + 1
      if (start < 0 || end <= block.end || !/^<[\w-]+\b/.test(remaining.slice(start))) {
        throw new Error('待验证：无法确定区块边界')
      }
      result.push({ ...block, content: source.slice(block.start, block.end) })
      remaining = remaining.slice(0, start) + remaining.slice(start, end).replace(/[^\r\n]/g, ' ') + remaining.slice(end)
    }
  }
  return { blocks: result.sort((a, b) => a.start - b.start), remaining }
}

module.exports = { dependency, blocks }
