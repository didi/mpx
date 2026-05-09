const path = require('path')
const { codeFrameColumns } = require('@babel/code-frame')
const { SourceMapConsumer } = require('source-map')

function offsetToPosition (source, offset) {
  const before = source.slice(0, offset)
  const lines = before.split(/\r\n|\r|\n/)
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  }
}

function offsetToLoc (source, start, end) {
  const loc = {
    start: offsetToPosition(source, start)
  }
  if (end != null) {
    loc.end = offsetToPosition(source, end)
  }
  return loc
}

function normalizeLoc (loc) {
  if (!loc) return
  if (loc.start) return loc
  if (loc.line) {
    return {
      start: {
        line: loc.line,
        column: loc.column || 1
      }
    }
  }
}

function createCodeFrame (source, loc) {
  loc = normalizeLoc(loc)
  if (!source || !loc || !loc.start) return ''
  return codeFrameColumns(source, loc, {
    highlightCode: false
  })
}

function originalPositionFor (map, loc) {
  loc = normalizeLoc(loc)
  if (!map || !loc || !loc.start) return
  if (typeof map === 'string') {
    try {
      map = JSON.parse(map)
    } catch (e) {
      return
    }
  }
  let consumer
  try {
    consumer = new SourceMapConsumer(map)
  } catch (e) {
    return
  }
  const original = consumer.originalPositionFor({
    line: loc.start.line,
    column: Math.max((loc.start.column || 1) - 1, 0)
  })
  if (!original || !original.source || !original.line) return
  const sourceIndex = map.sources && map.sources.indexOf(original.source)
  return {
    file: original.source,
    loc: {
      start: {
        line: original.line,
        column: (original.column || 0) + 1
      }
    },
    source: sourceIndex > -1 && map.sourcesContent && map.sourcesContent[sourceIndex],
    generatedLoc: loc
  }
}

function readSource (file, inputFileSystem) {
  if (!file || !inputFileSystem) return ''
  try {
    return inputFileSystem.readFileSync(path.resolve(file), 'utf-8')
  } catch (e) {
    return ''
  }
}

module.exports = {
  offsetToPosition,
  offsetToLoc,
  normalizeLoc,
  createCodeFrame,
  originalPositionFor,
  readSource
}
