export default function processOption (
  option,
  ctorType,
  importedPagesMap,
  importedComponentsMap,
  Vue,
  VueRouter
) {
  if (ctorType === 'app') {
    // 对于app中的组件需要全局注册
    for (var componentName in importedComponentsMap) {
      if (importedComponentsMap.hasOwnProperty(componentName)) {
        var component = importedComponentsMap[componentName]
        Vue.component(componentName, component)
      }
    }

    var routes = []

    for (var pagePath in importedPagesMap) {
      if (importedPagesMap.hasOwnProperty(pagePath)) {
        var page = importedPagesMap[pagePath]
        routes.push({
          path: pagePath,
          component: page
        })
      }
    }

    if (routes.length) {
      routes.push({
        path: '*',
        redirect: routes[0].path
      })
      option.router = new VueRouter({
        routes: routes
      })
    }
  } else {
    // 局部注册页面和组件中依赖的组件
    for (componentName in importedComponentsMap) {
      if (importedComponentsMap.hasOwnProperty(componentName)) {
        component = importedComponentsMap[componentName]
        if (!option.components) {
          option.components = {}
        }
        option.components[componentName] = component
      }
    }
  }

  console.log(option)

  return option
}
