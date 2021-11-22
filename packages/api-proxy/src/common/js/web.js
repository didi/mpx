function webHandleSuccess (result, success, complete) {
  typeof success === 'function' && success(result)
  typeof complete === 'function' && complete(result)
}

function webHandleFail (result, fail, complete) {
  typeof fail === 'function' && fail(result)
  typeof complete === 'function' && complete(result)
}

function isTabBarPage (router, options) {
  const toRoute = router.match(options.url, router.history.current)
  const toPath = toRoute.path
  const tabBarPath = []
  router.options && router.options.routes.forEach(item => {
    if (item.component && item.component.components && item.component.components['mpx-tab-bar']) {
      tabBarPath.push(item.path)
    }
  })
  return tabBarPath.includes(toPath)
}

export {
  webHandleSuccess,
  webHandleFail,
  isTabBarPage
}
