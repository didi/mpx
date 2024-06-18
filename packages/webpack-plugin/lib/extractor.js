const path = require('path')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')
const toPosix = require('./utils/to-posix')
const fixRelative = require('./utils/fix-relative')
const addQuery = require('./utils/add-query')
const normalize = require('./utils/normalize')
const { MPX_DISABLE_EXTRACTOR_CACHE, DEFAULT_RESULT_SOURCE } = require('./utils/const')

module.exports = content => content

module.exports.pitch = async function (remainingRequest) {
  const mpx = this.getMpx()
  const mode = mpx.mode
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const type = queryObj.type
  const index = queryObj.index || 0
  const isStatic = queryObj.isStatic
  const issuerResource = queryObj.issuerResource
  const fromImport = queryObj.fromImport
  const needBabel = queryObj.needBabel

  if (needBabel) {
    // 创建js request应用babel
    const request = addQuery(this.request, {}, true, ['needBabel'])
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

  if (issuerResource) {
    // 清空issuerResource/index query避免importModule对于不同的issuer无法复用模块缓存
    remainingRequest = addQuery(remainingRequest, {}, false, ['issuerResource', 'index'])
  }

  let request = remainingRequest
  // static的情况下需要用record-loader记录相关静态资源的输出路径，不能直接在这里记录，需要确保在子依赖开始构建前完成记录，因为子依赖构建时可能就需要访问当前资源的输出路径
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

  let resultSource = DEFAULT_RESULT_SOURCE

  if (typeof content !== 'string') return resultSource

  const extractedInfo = {
    content,
    // isStatic时不需要关注引用索引
    index: isStatic ? 0 : index
  }

  this.emitFile(file, '', undefined, {
    skipEmit: true,
    extractedInfo
  })

  const { buildInfo } = this._module

  // 如果importModule子模块中包含动态特性，比如动态添加入口和静态资源输出路径，则当前extractor模块不可缓存
  if (buildInfo.assetsInfo.has(MPX_DISABLE_EXTRACTOR_CACHE)) {
    this.cacheable(false)
  }

  const assetInfo = buildInfo.assetsInfo && buildInfo.assetsInfo.get(resourcePath)
  if (assetInfo && assetInfo.extractedResultSource) {
    resultSource = assetInfo.extractedResultSource
  }

  if (isStatic) {
    switch (type) {
      // styles为static就两种情况，一种是.mpx中使用src引用样式，第二种为css-loader中处理@import
      // 为了支持持久化缓存，.mpx中使用src引用样式对issueFile asset产生的副作用迁移到ExtractDependency中处理
      case 'styles':
        if (issuerResource) {
          const issuerFile = mpx.getExtractedFile(issuerResource)
          let relativePath = toPosix(path.relative(path.dirname(issuerFile), file))
          relativePath = fixRelative(relativePath, mode)
          if (fromImport) {
            resultSource += `module.exports = ${JSON.stringify(relativePath)};\n`
          } else {
            this.emitFile(issuerFile, '', undefined, {
              skipEmit: true,
              extractedInfo: {
                content: `@import "${relativePath}";\n`,
                index,
                pre: true
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

  if (!resultSource) buildInfo.isEmpty = true
  return resultSource
}
