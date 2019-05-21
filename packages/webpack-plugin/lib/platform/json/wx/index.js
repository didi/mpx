const runRules = require('../../run-rules')
const normalizeTest = require('../normalize-test')
const changeKey = require('../change-key')

module.exports = function getSpec ({ warn, error }) {
  function print (path, isError) {
    const msg = `Json path <${path}> is not supported in ali environment!`
    isError ? error(msg) : warn(msg)
  }

  function deletePath (isError) {
    return function (input, data = [], meta) {
      const currPath = meta.paths.join('|')
      print(data.concat(currPath).join('.'), isError)
      meta.paths.forEach((path) => {
        delete input[path]
      })
      return input
    }
  }

  const spec = {
    supportedTargets: ['ali', 'swan', 'tt'],
    normalizeTest,
    page: [
      {
        test: 'navigationBarTitleText',
        ali (input) {
          return changeKey(input, this.test, 'defaultTitle')
        }
      },
      {
        test: 'enablePullDownRefresh',
        ali (input) {
          input = changeKey(input, this.test, 'pullRefresh')
          if (input.pullRefresh) {
            input.allowsBounceVertical = 'YES'
          }
          return input
        }
      },
      {
        test: 'navigationBarBackgroundColor',
        ali (input) {
          return changeKey(input, this.test, 'titleBarColor')
        }
      },
      {
        test: 'disableSwipeBack',
        ali: deletePath(),
        qq: deletePath(),
        swan: deletePath()
      },
      {
        test: 'onReachBottomDistance|disableScroll',
        ali: deletePath(),
        qq: deletePath()
      },
      {
        test: 'backgroundColorTop|backgroundColorBottom',
        ali: deletePath(),
        swan: deletePath()
      },
      {
        test: 'navigationBarTextStyle|navigationStyle|backgroundColor|backgroundTextStyle',
        ali: deletePath()
      },
      {
        test: 'pageOrientation',
        ali: deletePath(),
        swan: deletePath(),
        tt: deletePath()
      }
    ],
    component: [
      {
        test: 'componentGenerics',
        ali: deletePath(true),
        swan: deletePath(true)
      }
    ],
    tabBar: {
      list: [
        {
          test: 'text',
          ali (input) {
            return changeKey(input, this.test, 'name')
          }
        },
        {
          test: 'iconPath',
          ali (input) {
            return changeKey(input, this.test, 'icon')
          }
        },
        {
          test: 'selectedIconPath',
          ali (input) {
            return changeKey(input, this.test, 'activeIcon')
          }
        }
      ],
      rules: [
        {
          test: 'color',
          ali (input) {
            return changeKey(input, this.test, 'textColor')
          }
        },
        {
          test: 'list',
          ali (input) {
            const value = input.list
            delete input.list
            input.items = runRules(spec.tabBar.list, value, {
              target: 'ali',
              normalizeTest,
              waterfall: true,
              data: ['tabBar', 'list']
            })
            return input
          }
        },
        {
          test: 'position',
          ali: deletePath(),
          swan: deletePath()
        },
        {
          test: 'borderStyle',
          ali: deletePath()
        },
        {
          test: 'custom',
          ali: deletePath(),
          swan: deletePath(),
          tt: deletePath()
        }
      ]
    },
    rules: [
      {
        test: 'resizable',
        ali: deletePath(),
        qq: deletePath(),
        swan: deletePath(),
        tt: deletePath()
      },
      {
        test: 'preloadRule',
        ali: deletePath(),
        qq: deletePath(),
        tt: deletePath()
      },
      {
        test: 'functionalPages|plugins|usingComponents',
        ali: deletePath(true),
        qq: deletePath(true),
        swan: deletePath(true),
        tt: deletePath()
      },
      {
        test: 'debug',
        ali: deletePath(),
        swan: deletePath()
      },
      {
        test: 'networkTimeout|workers|requiredBackgroundModes|navigateToMiniProgramAppIdList|permission',
        ali: deletePath(),
        swan: deletePath(),
        tt: deletePath()
      },
      {
        test: 'subpackages|subPackages',
        ali: deletePath(true),
        tt: deletePath()
      },
      {
        test: 'packages',
        ali (input) {
          input.packages = input.packages.map((packageItem) => {
            return packageItem.replace(/\?.*/, '')
          })
        },
        tt (input) {
          input.packages = input.packages.map((packageItem) => {
            return packageItem.replace(/\?.*/, '')
          })
        }
      },
      {
        test: 'tabBar',
        ali (input) {
          input.tabBar = runRules(spec.tabBar, input.tabBar, {
            target: 'ali',
            normalizeTest,
            waterfall: true,
            data: ['tabBar']
          })
        }
      },
      {
        test: 'window',
        ali (input) {
          input.window = runRules(spec.page, input.window, {
            target: 'ali',
            normalizeTest,
            waterfall: true,
            data: ['window']
          })
          return input
        }
      }
    ]
  }
  return spec
}
