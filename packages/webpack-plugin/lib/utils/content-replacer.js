const fs = require('fs')
const path = require('path')

const helper = {
  extname (filePath) {
    let ret
    if (/\.json\.js$/.test(filePath)) {
      ret = '.json.js'
    } else {
      ret = path.extname(filePath)
    }
    return ret
  }
}

// TODO MPX单文件未处理，在replacer需要自行过滤
function createContentReplacer (mpx) {
  function replace (opts) {
    const mode = mpx.mode
    const srcMode = mpx.srcMode
    const contentReplacer = mpx.options.contentReplacer

    const { resourcePath, content } = opts
    let newContent
    let newFilePath
    // return original content
    if (!contentReplacer) {
      newContent = content
    } else {
      const replaceResult = contentReplacer({
        resourcePath,
        content,
        mode,
        srcMode,
        helper
      })

      if (replaceResult) {
        if (replaceResult.content || replaceResult.content === '') {
          newContent = replaceResult.content
        } else if (replaceResult.filePath) {
          newContent = fs.readFileSync(replaceResult.filePath, { encoding: 'utf-8' })
          newFilePath = replaceResult.filePath
        } else {
          throw new Error('No replace result is found!')
        }
      } else {
        // Nothing changed
        newContent = content
      }
    }
    return {
      content: newContent,
      filePath: newFilePath || resourcePath
    }
  }

  return {
    replace
  }
}

module.exports = createContentReplacer
