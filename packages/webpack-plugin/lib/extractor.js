const path = require('path')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')
const toPosix = require('./utils/to-posix')
const fixRelative = require('./utils/fix-relative')
const normalize = require('./utils/normalize')
const addQuery = require('./utils/add-query')


const DEFAULT_RESULT_SOURCE = ''

module.exports = content => content

module.exports.pitch = async function (remainingRequest) {
  const mpx = this.getMpx()
  const mode = mpx.mode
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const type = queryObj.type
  const index = queryObj.index || 0
  const isStatic = queryObj.isStatic
  const issuerFile = queryObj.issuerFile
  const fromImport = queryObj.fromImport
  const needBabel = queryObj.needBabel

  if (type === 'json' && !isStatic) {
    // 非static的json时不能缓存，这部分内容包含动态入口添加，需要确保importModule每次都执行
    this.cacheable(false)
  }

  if (needBabel) {
    // 创建js request应用babel
    let request = addQuery(this.request, {}, true, ['needBabel'])
    const fakeRequest = addQuery(`${resourcePath}.js`, queryObj)
    return `module.exports = require(${loaderUtils.stringifyRequest(this, `${fakeRequest}!=!${request}`)});\n`
  }

  const file = mpx.getExtractedFile(this.resource, {
    warn: (err) => {
      this.emitWarning(err)
    },
    error: (err) => {
      this.emitError(err)
    }
  })

  let request = remainingRequest
  // static的情况下需要添加recordLoader记录相关静态资源的输出路径
  if (isStatic) {
    const recordLoader = normalize.lib('record-loader')
    request = `${recordLoader}!${remainingRequest}`
  }

  let content = await this.importModule(`!!${request}`)
  // 处理wxss-loader的返回
  if (Array.isArray(content)) {
    content = content.map((item) => {
      return item[1]
    }).join('\n')
  }

  this.emitFile(file, '', undefined, {
    skipEmit: true,
    extractedInfo: {
      content,
      index
    }
  })

  let resultSource = DEFAULT_RESULT_SOURCE

  const { buildInfo } = this._module

  const assetInfo = buildInfo.assetsInfo && buildInfo.assetsInfo.get(resourcePath)
  if (assetInfo && assetInfo.extractedResultSource) {
    resultSource = assetInfo.extractedResultSource
  }

  if (isStatic) {
    switch (type) {
      // styles为static就两种情况，一种是.mpx中使用src引用样式，第二种为css-loader中处理@import
      // 为了支持持久化缓存，.mpx中使用src引用样式对issueFile asset产生的副作用迁移到ExtractDependency中处理
      case 'styles':
        if (issuerFile) {
          let relativePath = toPosix(path.relative(path.dirname(issuerFile), file))
          relativePath = fixRelative(relativePath, mode)
          if (fromImport) {
            resultSource += `module.exports = ${JSON.stringify(relativePath)};\n`
          } else {
            this.emitFile(issuerFile, '', undefined, {
              extractedInfo: {
                content: `@import "${relativePath}";\n`,
                index: -1
              }
            })
          }
        }
        break
      case 'template':
        resultSource += `module.exports = __webpack_public_path__ + ${JSON.stringify(file)};\n`
        break
      case 'json':
        // 目前json为static时只有处理theme.json一种情况，该情况下返回的路径只能为不带有./或../开头的相对路径，否则微信小程序预览构建会报错，issue#622
        resultSource += `module.exports = ${JSON.stringify(file)};\n`
        break
    }
  }

  return resultSource

}

