const path = require('path')
const { ConcatSource, RawSource, ReplaceSource } = require('webpack').sources
const fixRelative = require('./fix-relative')
const toPosix = require('./to-posix')
const { MPX_ROOT_VIEW, MPX_SCROLLBAR_HIDDEN } = require('./const')

const aliCompatStyleFilename = 'mpx-ali-compat.acss'

const aliCompatStyle = `.${MPX_ROOT_VIEW} {
  display: initial;
}

page {
  line-height: normal;
}

text {
  white-space: inherit;
}

.${MPX_SCROLLBAR_HIDDEN}::-webkit-scrollbar {
  width: 0;
  height: 0;
  color: transparent;
  display: none;
}
`

function injectAliCompatStyle (compilation, appStyleFilename) {
  const compatStyleFilename = toPosix(path.join(path.dirname(appStyleFilename), aliCompatStyleFilename))

  if (compilation.getAsset(compatStyleFilename)) {
    compilation.errors.push(new Error(`[Mpx webpack plugin error]: The reserved ali compatibility style asset [${compatStyleFilename}] already exists, please rename the conflicting asset.`))
    return
  }

  let relativePath = path.relative(path.dirname(appStyleFilename), compatStyleFilename)
  relativePath = toPosix(fixRelative(relativePath, 'ali'))
  const importContent = `@import ${JSON.stringify(relativePath)};`
  const appStyleAsset = compilation.getAsset(appStyleFilename)

  compilation.emitAsset(compatStyleFilename, new RawSource(aliCompatStyle))
  if (!appStyleAsset) {
    compilation.emitAsset(appStyleFilename, new RawSource(importContent))
    return
  }

  compilation.updateAsset(appStyleFilename, (source) => {
    const charsetMatch = /^\uFEFF?@charset\s+(?:"[^"]*"|'[^']*')\s*;/i.exec(source.source().toString())
    if (charsetMatch) {
      const result = new ReplaceSource(source)
      result.insert(charsetMatch[0].length, `\n${importContent}`)
      return result
    }
    return new ConcatSource(importContent, '\n', source)
  })
}

module.exports = injectAliCompatStyle
