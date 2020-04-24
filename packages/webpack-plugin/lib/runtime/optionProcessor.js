import { SHOW, HIDE } from '@mpxjs/core/src/core/innerLifecycle'

export default function processOption (
  option,
  ctorType,
  firstPage,
  mpxCid,
  pageTitle,
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
      // 处理reLaunch中传递的url并非首页时的replace逻辑
      window.__mpxRouter.beforeEach(function (to, from, next) {
        var action = window.__mpxRouter.__mpxAction
        if (action && action.type === 'reLaunch') {
          if (to.path !== action.path) {
            return next({
              path: action.path,
              replace: true
            })
          }
        }
        next()
      })
      // 处理visibilitychange时触发当前活跃页面组件的onshow/onhide
      document.addEventListener('visibilitychange', function () {
        var vnode = window.__mpxRouter.__mpxActiveVnode
        if (vnode && vnode.componentInstance) {
          if (document.hidden) {
            vnode.componentInstance.__mpxProxy && vnode.componentInstance.__mpxProxy.callUserHook(HIDE)
          } else {
            vnode.componentInstance.__mpxProxy && vnode.componentInstance.__mpxProxy.callUserHook(SHOW)
          }
        }
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

  if (pageTitle) {
    option.pageTitle = pageTitle
  }

  return option
}

export function getComponent (component, isBulitIn) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (isBulitIn) component.__mpx_built_in__ = true
  return component
}
