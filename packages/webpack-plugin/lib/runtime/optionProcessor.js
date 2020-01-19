export default function processOption (
  option,
  ctorType,
  firstPage,
  mpxCid,
  pagesMap,
  componentsMap,
  Vue,
  VueRouter,
  VueI18n,
  i18n
) {
  if (ctorType === 'app') {
    // 对于app中的组件需要全局注册
    for (var componentName in componentsMap) {
      if (componentsMap.hasOwnProperty(componentName)) {
        var component = componentsMap[componentName]
        Vue.component(componentName, component)
      }
    }

    var routes = []

    for (var pagePath in pagesMap) {
      if (pagesMap.hasOwnProperty(pagePath)) {
        var page = pagesMap[pagePath]
        routes.push({
          path: pagePath,
          component: page
        })
      }
    }

    if (routes.length) {
      if (firstPage) {
        routes.push({
          path: '*',
          redirect: firstPage
        })
      }
      window.__mpxRouter = option.router = new VueRouter({
        routes: routes
      })
      // 初始化length
      window.__mpxRouter.__mpxHistoryLength = window.history.length
    }

    if (i18n) {
      window.__mpxI18n = option.i18n = new VueI18n(i18n)
    }
  } else {
    // 局部注册页面和组件中依赖的组件
    for (componentName in componentsMap) {
      if (componentsMap.hasOwnProperty(componentName)) {
        component = componentsMap[componentName]
        if (!option.components) {
          option.components = {}
        }
        option.components[componentName] = component
      }
    }
  }

  if (mpxCid) {
    option.mpxCid = mpxCid
  }

  return option
}
