const async = require('async')
const JSON5 = require('json5')
const path = require('path')
const loaderUtils = require('loader-utils')
const parseComponent = require('../../parser')
const parseRequest = require('../../utils/parse-request')
const evalJSONJS = require('../../utils/eval-json-js')
const getJSONContent = require('../../utils/get-json-content')
const { RESOLVE_IGNORED_ERR, JSON_JS_EXT } = require('../../utils/const')
const isUrlRequestRaw = require('../../utils/is-url-request')
const tabBarConfig = require('../../config')

class PageRecord {
  constructor (miniPagePath, resolveRequest, resolveContext, resourcePath, ignored, fromSubpackage) {
    this.miniPagePath = miniPagePath // 小程序路径
    this.resolveRequest = resolveRequest
    this.resolveContext = resolveContext
    this.resourcePath = resourcePath // 页面的文件路径
    this.ignored = ignored
    this.fromSubpackage = fromSubpackage
    this.checksum = [miniPagePath, resolveRequest, resolveContext, fromSubpackage].join('~')
  }

  isEquals (otherPageRecord) {
    return this.checksum === otherPageRecord.checksum
  }
}

module.exports = function (content) {
  const loaderCallback = this.async()
  const mpx = this.getMpx()
  if (!mpx) {
    return loaderCallback(null, content)
  }
  this.cacheable(false)
  const partialCompilePlugin = this.getMpxPartialCompilePlugin()
  const { queryObj } = parseRequest(this.resource)
  const useJSONJS = queryObj.useJSONJS || this.resourcePath.endsWith(JSON_JS_EXT)
  const mode = mpx.mode
  const env = mpx.env
  const isWebpackResolveMode = mpx.resolveMode === 'webpack'
  const fs = this._compiler.inputFileSystem
  const externals = mpx.externals
  const root = mpx.projectRoot
  const isUrlRequest = r => isUrlRequestRaw(r, root, externals)
  const urlToRequest = r => loaderUtils.urlToRequest(r)
  const getOutputPath = mpx.getOutputPath
  const tabBarPages = []

  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return this.resolve(context, request, (err, resource, info) => {
      if (err) return callback(err)
      if (resource === false) return callback(RESOLVE_IGNORED_ERR)
      callback(null, resource, info)
    })
  }

  let json
  try {
    if (useJSONJS) {
      json = evalJSONJS(content, this.resourcePath, this)
    } else {
      json = JSON5.parse(content || '{}')
    }
  } catch (err) {
    return loaderCallback(err)
  }

  const processTabBar = () => {
    let tabBarCfg = tabBarConfig[mode].tabBar
    let itemKey = tabBarCfg.itemKey

    if (json.tabBar && json.tabBar[itemKey]) {
      json.tabBar[itemKey].forEach(({ pagePath }) => {
        tabBarPages.push(pagePath)
      })
    }
  }

  const subPackagesCfg = {}
  const seenPage = new Set()

  const processPage = (page, context, tarRoot = '', callback) => {
    let aliasPath = ''
    // 指定别名路径
    if (typeof page !== 'string') {
      aliasPath = page.path
      page = page.src
    }
    if (!isUrlRequest(page)) return callback(null, page)
    if (!isWebpackResolveMode) {
      page = urlToRequest(page)
    }
    resolve(context, page, (err, resource) => {
      if (err) return callback(err)
      const { resourcePath } = parseRequest(resource)
      let outputPath
      if (aliasPath) {
        outputPath = aliasPath
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = getOutputPath(resourcePath, 'page')
        } else {
          outputPath = /^(.*?)(\.[^.]*)?$/.exec(relative)[1]
        }
      }

      const key = [resourcePath, outputPath, tarRoot].join('|')
      // page 可能带有 query，记录不带 query 的请求能更好的阻止 mpx 对 page 的解析
      page = parseRequest(page).resourcePath
      callback(null, {
        key,
        outputPath,
        resourcePath,
        resolveContext: context,
        resolveRequest: page
      })
    })
  }
 
  // 解析 pages 字段
  const processPages = (pages, context, tarRoot = '', callback, issuedByPagesField = false) => {
    if (pages) {
      async.eachOf(pages, (page, index, done) => {
        processPage(page, context, tarRoot, (err, result) => {
          if (err) return done(err === RESOLVE_IGNORED_ERR ? null : err)
          const { key, outputPath, resolveRequest, resolveContext, resourcePath } = result
          if (seenPage.has(key)) return done()
          seenPage.add(key)
          const miniPagePath = [tarRoot, outputPath].filter(Boolean).join('/')
          // 小程序首页，暂不支持 entryPagePath 配置
          const isEntryPage = (issuedByPagesField === true && index === 0)
          // 阻止 page 打包
          const ignored = (
            !isEntryPage && // 首页不应该被阻止
            !partialCompilePlugin.needCompilingPage(miniPagePath) && // 待打包的页面不应该被阻止
            !partialCompilePlugin.isPreprocessPage(resourcePath) && // 预处理的页面不应该阻止
            !tabBarPages.includes(miniPagePath) // tabBar 配置的页面不应该被阻止
          )
          partialCompilePlugin.addPageRecord(new PageRecord(
            miniPagePath, 
            resolveRequest, 
            resolveContext, 
            resourcePath,
            ignored, 
            !!tarRoot)
          )
          done()
        })
      }, callback)
    } else {
      callback()
    }
  }

  // 解析 packages 字段
  const processPackages = (packages, context, callback) => {
    if (packages) {
      async.eachOf(packages, (packagePath, index, eachDone) => {
        const { queryObj } = parseRequest(packagePath)
        async.waterfall([
          (waterfallCb) => {
            resolve(context, packagePath, (err, result) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(result)
              waterfallCb(err, rawResourcePath)
            })
          },
          (result, waterfallCb) => {
            fs.readFile(result, (err, content) => {
              if (err) return waterfallCb(err)
              waterfallCb(err, result, content.toString('utf-8'))
            })
          },
          (result, content, waterfallCb) => {
            const extName = path.extname(result)
            if (extName === '.mpx') {
              const parts = parseComponent(content, {
                filePath: result,
                needMap: this.sourceMap,
                mode,
                env
              })
              getJSONContent(parts.json || {}, this, (err, content) => {
                waterfallCb(err, result, content)
              })
            } else {
              waterfallCb(null, result, content)
            }
          },
          (result, content, waterfallCb) => {
            try {
              content = JSON5.parse(content)
            } catch (err) {
              return waterfallCb(err)
            }

            const processSelfQueue = []
            const context = path.dirname(result)

            if (content.pages) {
              let tarRoot = queryObj.root
              if (tarRoot) {
                delete queryObj.root
                let subPackage = {
                  tarRoot,
                  pages: content.pages,
                  ...queryObj
                }
                processSelfQueue.push((callback) => {
                  processSubPackage(subPackage, context, callback)
                })
              } else {
                processSelfQueue.push((callback) => {
                  processPages(content.pages, context, '', callback)
                })
              }
            }
            if (content.packages) {
              processSelfQueue.push((callback) => {
                processPackages(content.packages, context, callback)
              })
            }
            if (processSelfQueue.length) {
              async.parallel(processSelfQueue, waterfallCb)
            } else {
              waterfallCb()
            }
          }
        ], (err) => {
          eachDone(err === RESOLVE_IGNORED_ERR ? null : err)
        })
      }, callback)
    } else {
      callback()
    }
  }

  // 为了获取资源的所属子包，该函数需串行执行
  const processSubPackage = (subPackage, context, callback) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        return callback()
      }
      let tarRoot = subPackage.tarRoot || subPackage.root || ''
      let srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot || subPackagesCfg[tarRoot]) return callback()

      subPackagesCfg[tarRoot] = {
        root: tarRoot,
        pages: []
      }
      context = path.join(context, srcRoot)
      async.parallel([
        (callback) => {
          processPages(subPackage.pages, context, tarRoot, callback)
        }
      ], callback)
    } else {
      callback()
    }
  }

  const processSubPackages = (subPackages, context, callback) => {
    if (subPackages) {
      async.each(subPackages, (subPackage, eachDone) => {
        processSubPackage(subPackage, context, eachDone)
      }, callback)
    } else {
      callback()
    }
  }

  async.parallel([
    (callback) => {
      processTabBar()
      processPages(json.pages, this.context, '', callback, true)
    },
    (callback) => {
      processPackages(json.packages, this.context, callback)
    },
    (callback) => {
      processSubPackages(json.subPackages || json.subpackages, this.context, callback)
    }
  ], (err) => {
    if (err) return loaderCallback(err)
    // 所有的 page 路径产出
    partialCompilePlugin.startInvolvingPageCompiling()
    loaderCallback(null, content)
  })
}
