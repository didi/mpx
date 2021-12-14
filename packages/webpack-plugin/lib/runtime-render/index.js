const DynamicEntryDependency = require('../dependencies/DynamicEntryDependency')
const path = require('path')

const customElementPath = path.resolve(__dirname, 'mpx-custom-element.mpx')

module.exports = class RuntimeRender {
  static hasSubpackageHook = false
  static globalRuntimeComponents = []
  static componentsMap = {}
  static _injectedComponentsMap = {}

  static addFinishSubpackagesMakeHook (mpx) {
    if (RuntimeRender.hasSubpackageHook) {
      return
    }
    mpx.hooks.finishSubpackagesMake.tapAsync('mpx-custom-element-entry', (compilation, callback) => {
      const dep = new DynamicEntryDependency(customElementPath, 'component', 'mpx-custom-element')
      dep.addEntry(compilation, (err) => {
        if (err) {
          return callback(err)
        }
        callback()
      })
    })
    RuntimeRender.hasSubpackageHook = true
  }

  static setGlobalRuntimeComponents (components = []) {
    RuntimeRender.globalRuntimeComponents.push(...components)
  }

  static setComponentsMap (absolutePath, hashName) {
    RuntimeRender.componentsMap[absolutePath] = hashName
  }

  static setInjectedComponentsMap (absolutePath, nameOrPathObj = {}) {
    if (!RuntimeRender._injectedComponentsMap[absolutePath]) {
      RuntimeRender._injectedComponentsMap[absolutePath] = {}
    }
    Object.assign(RuntimeRender._injectedComponentsMap[absolutePath], nameOrPathObj)
  }

  static get injectedComponentsMap () {
    let res = {}
    for (let path in RuntimeRender.componentsMap) {
      const hashName = RuntimeRender.componentsMap[path]
      if (hashName) {
        res[hashName] = RuntimeRender._injectedComponentsMap[path]['resultPath']
      }
    }
    return res
  }
}
