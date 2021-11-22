function webHandleSuccess (result, success, complete) {
  typeof success === 'function' && success(result)
  typeof complete === 'function' && complete(result)
}

function webHandleFail (result, fail, complete) {
  typeof fail === 'function' && fail(result)
  typeof complete === 'function' && complete(result)
}

function isTabBarPage (url, router) {
  const tabBarPagesMap = global.__tabBarPagesMap
  if (!tabBarPagesMap || !url) return false
  const path = router.match(url, router.history.current).path
  return !!tabBarPagesMap[path.slice(1)]
}

export {
  webHandleSuccess,
  webHandleFail,
  isTabBarPage
}
