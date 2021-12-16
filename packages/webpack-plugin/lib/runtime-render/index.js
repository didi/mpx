const path = require('path')
const isEmptyObject = require('../utils/is-empty-object')

const configCache = {
  globalRuntimeComponents: [],
  componentsMap: {},
  injectedComponentsMap: {}
}

const MPX_CUSTOM_ELEMENT = 'mpx-custom-element'

module.exports = class RuntimeRender {
  constructor (compilation) {
    this.compilation = compilation
    this.outputPath = compilation.outputOptions.publicPath || ''
    this.hasSubpackageHook = false

    this.init()
  }

  get globalRuntimeComponents () {
    return configCache.globalRuntimeComponents
  }

  init () {
    if (configCache.globalRuntimeComponents.length > 0 || !isEmptyObject(configCache.injectedComponentsMap)) {
      Promise.resolve(this.addFinishSubpackagesMakeHook)
    }
  }

  addFinishSubpackagesMakeHook () {
    const mpx = this.compilation.__mpx__
    mpx.hooks.finishSubpackagesMake.tapAsync('mpx-custom-element-entry', (compilation, callback) => {
      const customElementPath = path.resolve(__dirname, `mpx-custom-element.mpx`)
      // 所有分包编译构建完后，将 currentPackageRoot 重置
      mpx.currentPackageRoot = ''
      // 挂载 mpx-custom-element 至 componentsMap 上
      const { outputPath, alreadyOutputed } = mpx.getPackageInfo({
        resource: customElementPath,
        outputPath: MPX_CUSTOM_ELEMENT,
        resourceType: 'component',
        warn (e) {
          compilation.warnings.push(e)
        },
        error (e) {
          compilation.warnings.push(e)
        }
      })
      if (alreadyOutputed) {
        return callback()
      }
      mpx.addEntry(customElementPath, outputPath, (err) => {
        if (err) {
          return callback(err)
        }
        callback()
      })
    })
    this.hasSubpackageHook = true
  }

  setGlobalRuntimeComponents (components = []) {
    configCache.globalRuntimeComponents.push(...components)
    if (!this.hasSubpackageHook) {
      this.addFinishSubpackagesMakeHook()
    }
  }

  setComponentsMap (absolutePath, hashName) {
    configCache.componentsMap[absolutePath] = hashName
    if (!this.hasSubpackageHook) {
      this.addFinishSubpackagesMakeHook()
    }
  }

  // todo 可以缓存
  get injectedComponentsMap () {
    let res = {}
    let _componentsMap = Object.values(this.compilation.__mpx__.componentsMap).reduce((preVal, curVal) => Object.assign(preVal, curVal), {})

    for (let path in configCache.componentsMap) {
      const hashName = configCache.componentsMap[path]
      if (hashName && _componentsMap[path]) {
        res[hashName] = this.outputPath + _componentsMap[path]
      }
    }
    // 缓存上一次需要被注入的组件
    configCache.injectedComponentsMap = res
    return res
  }

  get injectedWxss () {
    return Object.values(this.injectedComponentsMap).map(resultPath => `@import '${resultPath}.wxss';\n`).join('')
  }

  getInjectComponents (isAppJson) {
    if (isAppJson) {
      return this.hasSubpackageHook ? { element: this.outputPath + MPX_CUSTOM_ELEMENT } : {}
    } else {
      return this.injectedComponentsMap
    }
  }
}
