const async = require('async')
const path = require('path')
const loaderUtils = require('loader-utils')
const hash = require('hash-sum')
const parseRequest = require('../utils/parse-request')
const getPageName = require('../utils/get-page-name')
const toPosix = require('../utils/to-posix')
const addQuery = require('../utils/add-query')
const parseComponent = require('../parser')
const readJsonForSrc = require('../utils/read-json-for-src')

module.exports = function (json, options, rawCallback) {
  const mode = options.mode
  const defs = options.defs
  const loaderContext = options.loaderContext
  const resolveMode = options.resolveMode
  const pagesMap = options.pagesMap
  const componentsMap = options.componentsMap
  const projectRoot = options.projectRoot
  const localPagesMap = {}
  const localComponentsMap = {}
  let firstPage = ''
  let output = '/* json */\n'
  let jsonObj = {}
  const context = loaderContext.context

  const callback = (err) => {
    return rawCallback(err, {
      output,
      localPagesMap,
      localComponentsMap
    })
  }

  if (!json) {
    return callback()
  }

  try {
    jsonObj = JSON.parse(json.content)
  } catch (e) {
    return callback(e)
  }

  const fs = loaderContext._compiler.inputFileSystem

  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return loaderContext.resolve(context, request, callback)
  }

  const processPackages = (packages, context, callback) => {
    if (packages) {
      async.forEach(packages, (packagePath, callback) => {
        const parsed = parseRequest(packagePath)
        const queryObj = parsed.queryObj
        // readFile无法处理query
        packagePath = parsed.resourcePath
        async.waterfall([
          (callback) => {
            resolve(context, packagePath, (err, result) => {
              callback(err, result)
            })
          },
          (result, callback) => {
            loaderContext.addDependency(result)
            fs.readFile(result, (err, content) => {
              if (err) return callback(err)
              callback(err, result, content.toString('utf-8'))
            })
          },
          (result, content, callback) => {
            const filePath = result
            const extName = path.extname(filePath)
            if (extName === '.mpx' || extName === '.vue') {
              const parts = parseComponent(
                content,
                filePath,
                loaderContext.sourceMap,
                mode,
                defs
              )
              const json = parts.json || {}
              if (json.content) {
                content = json.content
              } else if (json.src) {
                return readJsonForSrc(json.src, loaderContext, (content) => {
                  callback(null, result, content)
                })
              }
            }
            callback(null, result, content)
          },
          (result, content, callback) => {
            try {
              content = JSON.parse(content)
            } catch (err) {
              return callback(err)
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
                  processPages(content.pages, '', '', context, callback)
                })
              }
            }
            if (content.packages) {
              processSelfQueue.push((callback) => {
                processPackages(content.packages, context, callback)
              })
            }
            if (processSelfQueue.length) {
              async.parallel(processSelfQueue, callback)
            } else {
              callback()
            }
          }
        ], callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processPages = (pages, srcRoot = '', tarRoot = '', context, callback) => {
    if (pages) {
      async.forEach(pages, (page, callback) => {
        const rawPage = page
        if (resolveMode === 'native') {
          page = loaderUtils.urlToRequest(page, projectRoot)
        }
        const name = getPageName(tarRoot, rawPage)
        const pagePath = '/' + toPosix(name)
        resolve(path.join(context, srcRoot), page, (err, resource) => {
          if (err) return callback(err)
          const { resourcePath, queryObj } = parseRequest(resource)
          // 如果存在page命名冲突，return err
          for (let key in pagesMap) {
            if (pagesMap[key] === pagePath && key !== resourcePath) {
              return callback(new Error(`Resources in ${resourcePath} and ${key} are registered with same page path ${pagePath}, which is not allowed!`))
            }
          }
          pagesMap[resourcePath] = pagePath
          localPagesMap[pagePath] = {
            resource: addQuery(resource, { page: true }),
            async: tarRoot || queryObj.async,
            isFirst: !tarRoot && rawPage === firstPage
          }
          callback()
        })
      }, callback)
    } else {
      callback()
    }
  }

  const processSubPackage = (subPackage, context, callback) => {
    if (subPackage) {
      let tarRoot = subPackage.tarRoot || subPackage.root || ''
      let srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return callback()
      processPages(subPackage.pages, srcRoot, tarRoot, context, callback)
    } else {
      callback()
    }
  }

  const processSubPackages = (subPackages, context, callback) => {
    if (subPackages) {
      async.forEach(subPackages, (subPackage, callback) => {
        processSubPackage(subPackage, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponents = (components, context, callback) => {
    if (components) {
      async.forEachOf(components, (component, name, callback) => {
        processComponent(component, name, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponent = (component, name, context, callback) => {
    if (/^plugin:\/\//.test(component)) {
      return callback()
    }
    if (resolveMode === 'native') {
      component = loaderUtils.urlToRequest(component, projectRoot)
    }

    resolve(context, component, (err, resource) => {
      if (err) return callback(err)
      const { resourcePath, queryObj } = parseRequest(resource)
      const parsed = path.parse(resourcePath)
      const componentId = parsed.name + hash(resourcePath)

      componentsMap[resourcePath] = componentId

      localComponentsMap[name] = {
        resource: addQuery(resource, { component: true, mpxCid: componentId }),
        async: queryObj.async
      }
      callback()
    })
  }

  async.parallel([
    (callback) => {
      if (jsonObj.pages) {
        firstPage = jsonObj.pages[0]
      }
      processPages(jsonObj.pages, '', '', context, callback)
    },
    (callback) => {
      processComponents(jsonObj.usingComponents, context, callback)
    },
    (callback) => {
      processPackages(jsonObj.packages, context, callback)
    },
    (callback) => {
      processSubPackages(json.subPackages || json.subpackages, context, callback)
    }
  ], callback)
}
