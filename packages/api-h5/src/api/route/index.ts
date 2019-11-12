function redirectTo (options: WechatMiniprogram.RedirectToOption) {
  const router = this.$router
  if (router) {
    router.replace({
      path: options.url,
      onComplete: () => {
        const errMsg = { errMsg: 'redirectTo:ok' }
        typeof options.success === 'function' && options.success(errMsg)
        typeof options.complete === 'function' && options.complete(errMsg)
      },
      onAbort: (err) => {
        const errMsg = { errMsg: err }
        typeof options.fail === 'function' && options.fail(errMsg)
        typeof options.complete === 'function' && options.complete(errMsg)
      }
    })
  }
}
function navigateTo (options: WechatMiniprogram.NavigateToOption) {
  const router = this.$router
  if (router) {
    router.push({
      path: options.url,
      onComplete: () => {
        const res = { errMsg: 'navigateTo:ok', eventChannel: null }
        typeof options.success === 'function' && options.success(res)
        typeof options.complete === 'function' && options.complete(res)
      },
      onAbort: (err) => {
        const res = { errMsg: err }
        typeof options.fail === 'function' && options.fail(res)
        typeof options.complete === 'function' && options.complete(res)
      }
    })
  }
}

function navigateBack (options: WechatMiniprogram.NavigateBackOption) {
  const router = this.$router
  const delta = options.delta || 1
  const res = { errMsg: 'navigateBack:ok' }
  router.go(-delta)
  typeof options.success === 'function' && options.success(res)
  typeof options.complete === 'function' && options.complete(res)
}
