import { successHandle, failHandle } from '../../../common/js'
import { hasOwn } from '@mpxjs/utils'
import Vue from 'vue'

function setTabBarStyle (options = {}) {
  const tabBar = mpxGlobal.__tabBar
  let resolved, rejected
  if (tabBar) {
    if (tabBar.custom) {
      rejected = { errMsg: 'setTabBarStyle:fail custom Tabbar' }
    } else {
      'color|selectedColor|backgroundColor|borderStyle'.split('|').forEach((key) => {
        if (hasOwn(options, key)) {
          Vue.set(tabBar, key, options[key])
        }
      })
      resolved = { errMsg: 'setTabBarStyle:ok' }
    }
  } else {
    rejected = { errMsg: 'setTabBarStyle:fail no tabBar found' }
  }

  if (resolved) {
    successHandle(resolved, options.success, options.complete)
  }
  failHandle(rejected, options.fail, options.complete)
}

function setTabBarItem (options = {}) {
  const tabBar = mpxGlobal.__tabBar
  let resolved, rejected
  if (tabBar) {
    if (tabBar.custom) {
      rejected = { errMsg: 'setTabBarItem:fail custom Tabbar' }
    } else {
      const item = tabBar.list[options.index]
      if (item) {
        'text|iconPath|selectedIconPath'.split('|').forEach((key) => {
          if (hasOwn(options, key)) {
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
    successHandle(resolved, options.success, options.complete)
  }
  failHandle(rejected, options.fail, options.complete)
}

function showTabBar (options = {}) {
  const tabBar = mpxGlobal.__tabBar
  let resolved, rejected
  if (tabBar) {
    Vue.set(tabBar, 'isShow', true)
    resolved = { errMsg: 'showTabBar:ok' }
  } else {
    rejected = { errMsg: 'showTabBar:fail no tabBar found' }
  }

  if (resolved) {
    successHandle(resolved, options.success, options.complete)
  }
  failHandle(rejected, options.fail, options.complete)
}

function hideTabBar (options = {}) {
  const tabBar = mpxGlobal.__tabBar
  let resolved, rejected
  if (tabBar) {
    Vue.set(tabBar, 'isShow', false)
    resolved = { errMsg: 'hideTabBar:ok' }
  } else {
    rejected = { errMsg: 'hideTabBar:fail no tabBar found' }
  }

  if (resolved) {
    successHandle(resolved, options.success, options.complete)
  }
  failHandle(rejected, options.fail, options.complete)
}

export {
  setTabBarItem,
  setTabBarStyle,
  showTabBar,
  hideTabBar
}
