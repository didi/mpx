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
    window: [
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
        ali (input, paths = [], meta) {
          const currPath = meta.paths.join('|')
          print(paths.concat(currPath).join('.'), true)
          meta.paths.forEach((path) => {
            delete input[path]
          })
          return input
        }
      }
    ],
    generics: [
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
            input.items = runRules(spec.tabBar.list, value, 'ali', undefined, normalizeTest, ['tabBar'])
            return input
          }
        },
        {
          test: 'borderStyle|position|custom',
          ali (input, option, meta) {
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
        test: 'networkTimeout|debug|functionalPages|subpackages|workers|requiredBackgroundModes|plugins|preloadRule|resizable|navigateToMiniProgramAppIdList|usingComponents|permission',
        ali (input, options, meta) {
          print(meta.paths.join('|'), true)
          meta.paths.forEach((path) => {
            delete input[path]
          })
          return input
        }
      },
      {
        test: 'window',
        ali (input) {
          input.window = runRules(spec.window, input.window, 'ali', undefined, normalizeTest, ['window'])
          return input
        }
      }
    ]
  }
  return spec
}
