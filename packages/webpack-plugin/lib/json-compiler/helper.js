const path = require('path')
const normalize = require('../utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')
const isUrlRequestRaw = require('../utils/is-url-request')
const parseRequest = require('../utils/parse-request')
const addQuery = require('../utils/add-query')
const loaderUtils = require('loader-utils')
const resolve = require('../utils/resolve')
const { matchCondition } = require('../utils/match-condition')
const { isWeb, isReact } = require('../utils/env')
const getBuildInTagComponent = require('../utils/get-build-tag-component')
const { capitalToHyphen } = require('../utils/string')

module.exports = function createJSONHelper ({ loaderContext, emitWarning, customGetDynamicEntry, emitError }) {
  const mpx = loaderContext.getMpx()
  const resolveMode = mpx.resolveMode
  const externals = mpx.externals
  const root = mpx.projectRoot
  const publicPath = (loaderContext._compilation && loaderContext._compilation.outputOptions.publicPath) || ''
  const pathHash = mpx.pathHash
  const getOutputPath = mpx.getOutputPath
  const mode = mpx.mode
  const supportRequireAsync = mpx.supportRequireAsync
  const asyncSubpackageRules = mpx.asyncSubpackageRules

  const isUrlRequest = r => isUrlRequestRaw(r, root, externals)
  const urlToRequest = r => loaderUtils.urlToRequest(r)
  const isScript = ext => /\.(ts|js)$/.test(ext)

  const dynamicEntryMap = new Map()

  let dynamicEntryCount = 0

  const getDynamicEntry = (request, type, outputPath = '', packageRoot = '', relativePath = '', context = '', extraOptions = {}) => {
    if (typeof customGetDynamicEntry === 'function') return customGetDynamicEntry(request, type, outputPath, packageRoot, relativePath, context)
    const key = `mpx_dynamic_entry_${dynamicEntryCount++}`
    const value = `__mpx_dynamic_entry__( ${JSON.stringify(request)},${JSON.stringify(type)},${JSON.stringify(outputPath)},${JSON.stringify(packageRoot)},${JSON.stringify(relativePath)},${JSON.stringify(context)},'${JSON.stringify(extraOptions)}')`
    dynamicEntryMap.set(key, value)
    return key
  }

  const processDynamicEntry = (output) => {
    return output.replace(/"mpx_dynamic_entry_\d+"/g, (match) => {
      const key = match.slice(1, -1)
      return dynamicEntryMap.get(key)
    })
  }

  const processComponent = (component, context, { tarRoot = '', outputPath = '', relativePath = '', extraOptions = {} }, callback) => {
    if (!isUrlRequest(component)) return callback(null, component)
    if (resolveMode === 'native') {
      component = urlToRequest(component)
    }
    resolve(context, component, loaderContext, (err, resource, info) => {
      if (err) return callback(err)
      const resolveResourcePath = resource
      const { resourcePath, queryObj } = parseRequest(resource)
      let placeholder = ''
      if (queryObj.root) {
        // 删除root query
        resource = addQuery(resource, {}, false, ['root'])
        if (supportRequireAsync) {
          tarRoot = queryObj.root
          extraOptions.isAsync = true
        }
      } else if (!queryObj.root && asyncSubpackageRules && supportRequireAsync) {
        for (const item of asyncSubpackageRules) {
          if (matchCondition(resourcePath, item)) {
            tarRoot = item.root
            extraOptions.isAsync = true
            placeholder = item.placeholder
            break
          }
        }
      }

      const parsed = path.parse(resourcePath)
      const ext = parsed.ext
      const resourceName = path.join(parsed.dir, parsed.name)

      if (!outputPath) {
        if (isScript(ext) && resourceName.includes('node_modules') && !isWeb(mode) && !isReact(mode)) {
          const root = info.descriptionFileRoot
          let name = 'nativeComponent'
          if (info.descriptionFileData) {
            if (info.descriptionFileData.name) {
              // 去掉name里面的@符号，因为支付宝不支持文件路径上有@
              name = info.descriptionFileData.name.replace(/@/g, '')
            }
          }
          const relative = path.relative(root, resourceName)
          outputPath = path.join('components', name + pathHash(root), relative)
        } else {
          outputPath = getOutputPath(resourcePath, 'component')
        }
      }
      if (isScript(ext) && !isWeb(mode) && !isReact(mode)) {
        resource = `!!${nativeLoaderPath}!${resource}`
      }

      const entry = getDynamicEntry(resource, 'component', outputPath, tarRoot, relativePath, '', extraOptions)
      callback(null, entry, {
        tarRoot,
        placeholder,
        resourcePath,
        resolveResourcePath,
        queryObj
      })
    })
  }

  const processPage = (page, context, tarRoot = '', callback) => {
    let aliasPath = ''
    if (typeof page !== 'string') {
      aliasPath = page.path
      page = page.src
    }
    if (!isUrlRequest(page)) return callback(null, page, { key: page })
    if (resolveMode === 'native') {
      page = urlToRequest(page)
    }
    // 增加 page 标识
    page = addQuery(page, { isPage: true })
    resolve(context, page, loaderContext, (err, resource) => {
      if (err) {
        return callback(err)
      }
      const { resourcePath, queryObj: { isFirst } } = parseRequest(resource)
      const ext = path.extname(resourcePath)
      let outputPath
      if (aliasPath) {
        outputPath = aliasPath.replace(/^\//, '')
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = getOutputPath(resourcePath, 'page')
          emitWarning(`Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${outputPath}], use ?resolve to get the page path and navigate to it!`)
        } else {
          outputPath = /^(.*?)(\.[^.]*)?$/.exec(relative)[1]
        }
      }
      if (isScript(ext) && !isWeb(mode) && !isReact(mode)) {
        resource = `!!${nativeLoaderPath}!${resource}`
      }
      const entry = getDynamicEntry(resource, 'page', outputPath, tarRoot, publicPath + tarRoot)
      const key = [resourcePath, outputPath, tarRoot].join('|')
      callback(null, entry, {
        isFirst,
        key,
        resource
      })
    })
  }

  const processJsExport = (js, context, tarRoot = '', callback) => {
    if (resolveMode === 'native') {
      js = urlToRequest(js)
    }
    resolve(context, js, loaderContext, (err, resource) => {
      if (err) return callback(err)
      const { resourcePath } = parseRequest(resource)
      const relative = path.relative(context, resourcePath)
      if (/^\./.test(relative)) {
        return callback(new Error(`The js export path ${resourcePath} must be in the context ${context}!`))
      }
      const outputPath = /^(.*?)(\.[^.]*)?$/.exec(relative)[1]
      const entry = getDynamicEntry(resource, 'export', outputPath, tarRoot, publicPath + tarRoot)
      callback(null, entry)
    })
  }

  const fillInComponentPlaceholder = (jsonObj, { name: componentName, placeholder, placeholderEntry, resolveResourcePathMap }, callback) => {
    let placeholderComponentName = placeholder.name
    const componentPlaceholder = jsonObj.componentPlaceholder || {}
    if (componentPlaceholder[componentName]) return
    jsonObj.componentPlaceholder = componentPlaceholder
    if (placeholderEntry) {
      if (resolveResourcePathMap.has(placeholderComponentName) && resolveResourcePathMap.get(placeholderComponentName) !== placeholder.resolveResourcePath) {
        // 如果存在placeholder与已有usingComponents冲突, 重新生成一个组件名，在当前组件后增加一个数字
        let i = 1
        let newPlaceholder = placeholderComponentName + i
        while (jsonObj.usingComponents[newPlaceholder]) {
          newPlaceholder = placeholderComponentName + ++i
        }
        placeholderComponentName = newPlaceholder
      }
      jsonObj.usingComponents[placeholderComponentName] = placeholderEntry
      resolveResourcePathMap.set(placeholderComponentName, placeholder.resolveResourcePath)
    }
    componentPlaceholder[componentName] = placeholderComponentName
    callback(null, {
      name: placeholderComponentName,
      entry: placeholderEntry
    })
  }

  const getNormalizePlaceholder = (placeholder) => {
    if (typeof placeholder === 'string') {
      placeholder = getBuildInTagComponent(mode, placeholder) || { name: placeholder }
    }
    if (!placeholder.name) {
      emitError('The asyncSubpackageRules configuration format of @mpxjs/webpack-plugin a is incorrect')
    }
    // ali 下与 rulesRunner 规则一致，组件名驼峰转连字符
    if (mode === 'ali') {
      placeholder.name = capitalToHyphen(placeholder.name)
    }
    return placeholder
  }

  const processAsyncSubpackageRules = (jsonObj, context, { name, tarRoot, placeholder, relativePath, resolveResourcePathMap }, callback) => {
    if (tarRoot) {
      if (placeholder) {
        placeholder = getNormalizePlaceholder(placeholder)
        if (placeholder.resource) {
          processComponent(placeholder.resource, context, { relativePath }, (err, entry, { resolveResourcePath }) => {
            if (err) return callback(err)
            placeholder.resolveResourcePath = resolveResourcePath
            fillInComponentPlaceholder(jsonObj, { name, placeholder, placeholderEntry: entry, resolveResourcePathMap }, callback)
          })
        } else {
          fillInComponentPlaceholder(jsonObj, { name, placeholder }, callback)
        }
      } else {
        if (!jsonObj.componentPlaceholder || !jsonObj.componentPlaceholder[name]) {
          const errMsg = `componentPlaceholder of "${name}" doesn't exist! \n\r`
          emitError(errMsg)
        }
        callback()
      }
    } else {
      callback()
    }
  }

  return {
    processComponent,
    processDynamicEntry,
    processPage,
    processJsExport,
    processAsyncSubpackageRules,
    isUrlRequest,
    urlToRequest
  }
}
