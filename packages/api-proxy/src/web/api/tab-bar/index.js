import { webHandleSuccess, webHandleFail } from '../../../common/js'
import Vue from 'vue'

function setTabBarStyle (options = {}) {
  const tabBar = global.__tabBar
  let resolved, rejected
  if (tabBar) {
    if (tabBar.custom) {
      rejected = { errMsg: 'setTabBarStyle:fail custom Tabbar' }
    } else {
      'color|selectedColor|backgroundColor|borderStyle'.split('|').forEach((key) => {
        if (options.hasOwnProperty(key)) {
          Vue.set(tabBar, key, options[key])
        }
      })
      resolved = { errMsg: 'setTabBarStyle:ok' }
    }
  } else {
    rejected = { errMsg: 'setTabBarStyle:fail no tabBar found' }
  }

  if (resolved) {
    webHandleSuccess(resolved, options.success, options.complete)
    return Promise.resolve(resolved)
  }
  webHandleFail(rejected, options.fail, options.complete)
  return Promise.reject(rejected)
}

function setTabBarItem (options = {}) {
  const tabBar = global.__tabBar
  let resolved, rejected
  if (tabBar) {
    if (tabBar.custom) {
      rejected = { errMsg: 'setTabBarItem:fail custom Tabbar' }
    } else {
      const item = tabBar.list[options.index]
      if (item) {
        'text|iconPath|selectedIconPath'.split('|').forEach((key) => {
          if (options.hasOwnProperty(key)) {
            Vue.set(item, key, options[key])
          }
        })
        resolved = { errMsg: 'setTabBarItem:ok' }
      } else {
        rejected = { errMsg: 'setTabBarItem:fail no Tabbar item found' }
      }
    }
  } else {
    rejected = { errMsg: 'setTabBarItem:fail no tabBar found' }
  }

  if (resolved) {
    webHandleSuccess(resolved, options.success, options.complete)
    return Promise.resolve(resolved)
  }
  webHandleFail(rejected, options.fail, options.complete)
  return Promise.reject(rejected)
}

function showTabBar (options = {}) {
  const tabBar = global.__tabBar
  let resolved, rejected
  if (tabBar) {
    Vue.set(tabBar, 'isShow', true)
    resolved = { errMsg: 'showTabBar:ok' }
  } else {
    rejected = { errMsg: 'showTabBar:fail no tabBar found' }
  }

  if (resolved) {
    webHandleSuccess(resolved, options.success, options.complete)
    return Promise.resolve(resolved)
  }
  webHandleFail(rejected, options.fail, options.complete)
  return Promise.reject(rejected)
}

function hideTabBar (options = {}) {
  const tabBar = global.__tabBar
  let resolved, rejected
  if (tabBar) {
    Vue.set(tabBar, 'isShow', false)
    resolved = { errMsg: 'hideTabBar:ok' }
  } else {
    rejected = { errMsg: 'hideTabBar:fail no tabBar found' }
  }

  if (resolved) {
    webHandleSuccess(resolved, options.success, options.complete)
    return Promise.resolve(resolved)
  }
  webHandleFail(rejected, options.fail, options.complete)
  return Promise.reject(rejected)
}

export {
  setTabBarItem,
  setTabBarStyle,
  showTabBar,
  hideTabBar
}
