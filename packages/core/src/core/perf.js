import * as perf from '@mpxjs/perf'

export const instanceLifecycleMeasureNames = __mpx_perf_framework__
  ? {
      __beforeCreate__: 'lifecycle:beforeCreate',
      __created__: 'lifecycle:created',
      __beforeMount__: 'lifecycle:beforeMount',
      __mounted__: 'lifecycle:mounted',
      __beforeUpdate__: 'lifecycle:beforeUpdate',
      __updated__: 'lifecycle:updated',
      __beforeUnmount__: 'lifecycle:beforeUnmount',
      __unmounted__: 'lifecycle:unmounted',
      __onLoad__: 'lifecycle:onLoad',
      __onShow__: 'lifecycle:onShow',
      __onHide__: 'lifecycle:onHide',
      __onResize__: 'lifecycle:onResize',
      __serverPrefetch__: 'lifecycle:serverPrefetch',
      __reactHooksExec__: 'lifecycle:reactHooksExec'
    }
  : {}

const appLifecycleMeasureNames = __mpx_perf_framework__
  ? {
      onLaunch: 'lifecycle:app:onLaunch',
      onShow: 'lifecycle:app:onShow',
      onHide: 'lifecycle:app:onHide',
      onError: 'lifecycle:app:onError',
      onPageNotFound: 'lifecycle:app:onPageNotFound',
      onUnhandledRejection: 'lifecycle:app:onUnhandledRejection',
      onThemeChange: 'lifecycle:app:onThemeChange',
      onSSRAppCreated: 'lifecycle:app:onSSRAppCreated',
      onAppInit: 'lifecycle:app:onAppInit'
    }
  : {}

export function wrapAppLifecycleHooks (options) {
  if (!__mpx_perf_framework__) return
  Object.keys(appLifecycleMeasureNames).forEach((hookName) => {
    const hook = options[hookName]
    if (typeof hook !== 'function') return
    options[hookName] = function (...args) {
      if (hookName === 'onLaunch') perf.mark('app:onLaunch:start')
      const id = perf.scopeStart(appLifecycleMeasureNames[hookName])
      const result = hook.apply(this, args)
      perf.scopeEnd(id)
      return result
    }
  })
}
