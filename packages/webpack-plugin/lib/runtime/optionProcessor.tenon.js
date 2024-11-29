// import { inBrowser } from '../utils/env'

import { hasOwn } from './utils'

export function processComponentOption (
  {
    option,
    ctorType,
    outputPath,
    pageConfig,
    componentsMap,
    componentGenerics,
    genericsInfo,
    wxsMixin,
    hasApp,
  }
) {
  if (ctorType === 'app') {
    // 对于app中的组件需要全局注册
    for (const componentName in componentsMap) {
      if (hasOwn(componentsMap, componentName)) {
        const component = componentsMap[componentName]
        Vue.component(componentName, component)
      }
    }
  } else {
    // 局部注册页面和组件中依赖的组件
    for (const componentName in componentsMap) {
      if (hasOwn(componentsMap, componentName)) {
        const component = componentsMap[componentName]
        if (!option.components) {
          option.components = {}
        }
        option.components[componentName] = component
      }
    }

    if (ctorType === 'page') {
      (option.mixins ? option.mixins : (option.mixins = [])).push({
        // cache page instance in tenon
        created () {
          global.__currentPageInstance = this
        }
      })
      option.__mpxPageConfig = Object.assign({}, global.__mpxPageConfig, pageConfig)
    }
  }

  if (wxsMixin) {
    if (option.mixins) {
      option.mixins.push(mixin)
    } else {
      option.mixins = [mixin]
    }
  }

  if (outputPath) {
    option.componentPath = '/' + outputPath
  }

  return option
}

export function getComponent (component, extendOptions) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (extendOptions) Object.assign(component, extendOptions)
  return component
}

export function getWxsMixin (wxsModules) {
  if (!wxsModules) return {}
  return {
    created () {
      Object.keys(wxsModules).forEach((key) => {
        if (key in this) {
          console.error(`[Mpx runtime error]: The wxs module key [${key}] exist in the component/page instance already, please check and rename it!`)
        } else {
          this[key] = wxsModules[key]
        }
      })
    }
  }
}
