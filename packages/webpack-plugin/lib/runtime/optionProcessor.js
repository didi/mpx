import { SHOW, HIDE } from '@mpxjs/core/src/core/innerLifecycle'

export default function processOption (
  option,
  ctorType,
  firstPage,
  mpxCid,
  jsonConfig,
  pagesMap,
  componentsMap,
  Vue,
  VueRouter,
  VueI18n,
  i18n
) {
  if (ctorType === 'page') {
    option.__mpxPageConfig = Object.assign({}, window.__mpxPageConfig, jsonConfig)
  }
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
      window.__mpxRouter.stack = []
      window.__mpxRouter.needCache = null
      window.__mpxRouter.needRemove = []
      // 处理reLaunch中传递的url并非首页时的replace逻辑
      window.__mpxRouter.beforeEach(function (to, from, next) {
        var action = window.__mpxRouter.__mpxAction
        var stack = window.__mpxRouter.stack
        // 处理人为操作
        if (!action) {
          if (stack.length > 1 && stack[stack.length - 2].path === to.path) {
            action = {
              type: 'back',
              delta: 1
            }
          } else {
            action = {
              type: 'to'
            }
          }
        }
        var insertItem = {
          path: to.path
        }
        // 构建历史栈
        switch (action.type) {
          case 'to':
            stack.push(insertItem)
            window.__mpxRouter.needCache = insertItem
            break
          case 'back':
            window.__mpxRouter.needRemove = stack.splice(stack.length - action.delta, action.delta)
            break
          case 'redirect':
            window.__mpxRouter.needRemove = stack.splice(stack.length - 1, 1, insertItem)
            window.__mpxRouter.needCache = insertItem
            break
          case 'reLaunch':
            if (!action.reLaunched) {
              action.reLaunched = true
              window.__mpxRouter.needRemove = stack
              window.__mpxRouter.stack = [insertItem]
              window.__mpxRouter.needCache = insertItem
            }
            if (!action.replaced) {
              action.replaced = true
              return next({
                path: action.path,
                query: {
                  reLaunchCount: action.reLaunchCount
                },
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

  return option
}

export function getComponent (component, isBulitIn) {
  component = component.__esModule ? component.default : component
  // eslint-disable-next-line
  if (isBulitIn) component.__mpx_built_in__ = true
  return component
}
