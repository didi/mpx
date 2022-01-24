const path = require('path')
const normalize = require('../utils/normalize')
const async = require('async')
const parseRequest = require('../utils/parse-request')
const { virtualModules } = require('./plugin')
const { MPX_PROCESSED_FLAG } = require('../utils/const')
const addQuery = require('../utils/add-query')
const loader = normalize.lib('runtime-render/loader')
const stringifyLoadersAndResource = require('../utils/stringify-loaders-resource')
const toPosix = require('../utils/to-posix')
const virtualTemplateString = require('./virtual-template')

const configCache = {
  globalRuntimeComponents: [],
  componentsMap: {},
  injectedComponentsMap: {},
  usingRuntimePackages: new Set()
}

const MPX_CUSTOM_ELEMENT = 'mpx-custom-element'

const processMpxCustomElement = (mpx, packageName, callback) => {
  const customElementPath = path.resolve(__dirname, `${MPX_CUSTOM_ELEMENT}-${packageName}.mpx`)
  let outputPath = `${MPX_CUSTOM_ELEMENT}-${packageName}`
  if (packageName !== 'main') {
    outputPath = toPosix(path.join(packageName, outputPath))
  }
  // 挂载组件信息至 componentsMap
  mpx.componentsMap[packageName][customElementPath] = outputPath
  // 创建虚拟模块
  virtualModules.writeModule(customElementPath, virtualTemplateString)
  // 添加自定义组件进入编译流程
  mpx.addEntry(customElementPath + `?mpxCustomElement&packageRoot=${packageName}`, outputPath, (err, module) => {
    // 自定义容器组件不缓存
    module.invalidateBuild()
    if (err) return callback(err)
    callback()
  })
}

module.exports = class RuntimeRender {
  constructor (compilation) {
    this.compilation = compilation
    this.outputPath = compilation.outputOptions.publicPath || ''
    this.runtimeRenderHook = false

    this.init()
  }

  init () {
    // watch 模式下依据缓存来进行实例化
    if (this.usingRuntimePackages.size > 0) {
      setImmediate(() => {
        this.addRuntimeRenderHook()
      })
    }
  }

  addRuntimeRenderHook () {
    if (this.runtimeRenderHook) return
    const mpx = this.compilation.__mpx__
    const normalModuleFactory = this.compilation.params.normalModuleFactory
    // 对于 mpxCustomElement 的 loader 规则后置，stage 单独定义
    normalModuleFactory.hooks.afterResolve.tap({
      name: 'MpxRuntimeRender',
      stage: this.compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
    }, (resolveData) => {
      const { createData } = resolveData
      const { queryObj } = parseRequest(createData.request)
      // 只对 mpxCustomElement 做拦截处理
      if (queryObj.mpx && queryObj.extract && queryObj.mpxCustomElement && queryObj.mpxCustomElement !== MPX_PROCESSED_FLAG) {
        // 重新构造 loaders 数组
        createData.loaders = [{
          loader: loader
        }]

        createData.resource = addQuery(createData.resource, { mpxCustomElement: MPX_PROCESSED_FLAG }, true)
        createData.request = stringifyLoadersAndResource(createData.loaders, createData.resource)
      }
    })

    mpx.hooks.finishSubpackagesMake.tapAsync('mpx-custom-element-entry', (compilation, callback) => {
      if (this.usingRuntimePackages.size === 0) {
        return callback()
      }

      const tasks = Array.from(this.usingRuntimePackages).map(pkg => (callback) => {
        processMpxCustomElement(mpx, pkg, callback)
      })
      async.parallel(tasks, () => {
        callback()
      })
    })

    this.runtimeRenderHook = true
  }

  get usingRuntimePackages () {
    return configCache.usingRuntimePackages
  }

  addUsingRuntimePackages (packageName) {
    configCache.usingRuntimePackages.add(packageName)
  }

  get globalRuntimeComponents () {
    return configCache.globalRuntimeComponents
  }

  addGlobalRuntimeComponents (name) {
    configCache.globalRuntimeComponents.push(name)
  }

  setComponentsMap (absolutePath, hashName, packageName) {
    if (!configCache.componentsMap[packageName]) {
      configCache.componentsMap[packageName] = {}
    }
    configCache.componentsMap[packageName][absolutePath] = hashName
  }

  getPackageInjectedComponentsMap (packageName = 'main') {
    let res = {}
    let _componentsMap = Object.values(this.compilation.__mpx__.componentsMap).reduce((preVal, curVal) => Object.assign(preVal, curVal), {})
    const componentsMap = configCache.componentsMap[packageName]
    for (let path in componentsMap) {
      const hashName = componentsMap[path]
      if (hashName && _componentsMap[path]) {
        res[hashName] = this.outputPath + _componentsMap[path]
      }
    }

    // 缓存上一次需要被注入的组件
    configCache.injectedComponentsMap[packageName] = res
    return res
  }

  getPackageInjectedWxss (packageName = 'main') {
    return Object.values(this.getPackageInjectedComponentsMap(packageName)).map(resultPath => `@import '${resultPath}.wxss';\n`).join('')
  }
}
