const runRules = require('../../run-rules')
const normalizeTest = require('../normalize-test')
const changeKey = require('../change-key')

module.exports = function getSpec ({ warn, error }) {
  function print (path, isError) {
    const msg = `Json path <${path}> is not supported in ali environment!`
    isError ? error(msg) : warn(msg)
  }

  const spec = {
    supportedTargets: ['ali'],
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
        test: 'navigationBarTextStyle|navigationStyle|backgroundColor|backgroundTextStyle|backgroundColorTop|backgroundColorBottom|onReachBottomDistance|pageOrientation',
        ali (input, data = [], meta) {
          const currPath = meta.paths.join('|')
          print(data.concat(currPath).join('.'), true)
          meta.paths.forEach((path) => {
            delete input[path]
          })
          return input
        }
      }
    ],
    component: [
      {
        test: 'componentGenerics',
        ali (input) {
          print(this.test, true)
          delete input.componentGenerics
          return input
        }
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
          test: 'borderStyle|position|custom',
          ali (input, data, meta) {
            print(meta.paths.join('|'), true)
            meta.paths.forEach((path) => {
              delete input[path]
            })
            return input
          }
        }
      ]
    },
    rules: [
      {
        test: 'networkTimeout|debug|functionalPages|subpackages|subPackages|workers|requiredBackgroundModes|plugins|preloadRule|resizable|navigateToMiniProgramAppIdList|usingComponents|permission',
        ali (input, data, meta) {
          print(meta.paths.join('|'), true)
          meta.paths.forEach((path) => {
            delete input[path]
          })
          return input
        }
      },
      {
        test: 'packages',
        ali (input) {
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
