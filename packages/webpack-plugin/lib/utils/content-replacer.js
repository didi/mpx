const fs = require('fs')

function createContentReplacer (mpx) {
  async function replace (opts) {
    const mode = mpx.mode
    const srcMode = mpx.srcMode
    const contentReplacer = mpx.options.contentReplacer

    const { resourcePath, content } = opts
    let ret
    // return original content
    if (!contentReplacer) {
      ret = content
    } else {
      const replaceResult = await contentReplacer({
        resourcePath,
        content,
        mode,
        srcMode
      })

      if (replaceResult) {
        if (replaceResult.content) {
          ret = replaceResult.content
        } else if (replaceResult.filePath) {
          ret = await new Promise((resolve, reject) => {
            fs.readFile(replaceResult.filePath, (err, raw) => {
              if (err) {
                reject(err)
              } else {
                resolve(raw.toString('utf-8'))
              }
            })
          })
        } else {
          throw new Error('No replace result is found!')
        }
      } else {
        // Nothing changed
        ret = content
      }
    }
    return ret
  }

  return {
    replace
  }
}

module.exports = createContentReplacer
