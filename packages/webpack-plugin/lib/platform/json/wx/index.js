const runRules = require('../../run-rules')
const normalizeTest = require('../normalize-test')
const changeKey = require('../change-key')
const normalize = require('../../../utils/normalize')
const { capitalToHyphen } = require('../../../utils/string')
const { isOriginTag, isBuildInTag } = require('../../../utils/dom-tag-config')

const mpxViewPath = normalize.lib('runtime/components/ali/mpx-view.mpx')
const mpxTextPath = normalize.lib('runtime/components/ali/mpx-text.mpx')

module.exports = function getSpec ({ warn, error }) {
  function print (mode, path, isError) {
    const msg = `Json path <${path}> is not supported in ${mode} environment!`
    isError ? error(msg) : warn(msg)
  }

  function deletePath (opts) {
    let isError = opts
    let shouldLog = true
    if (typeof opts === 'object') {
      shouldLog = !opts.noLog
      isError = opts.isError
    }

    return function (input, { mode, pathArr = [] }, meta) {
      const currPath = meta.paths.join('|')
      if (shouldLog) {
        print(mode, pathArr.concat(currPath).join('.'), isError)
      }
      meta.paths.forEach((path) => {
        delete input[path]
      })
      return input
    }
  }

  /**
   * @desc 在app.mpx里配置usingComponents作为全局组件
   */

  function addGlobalComponents (input, { globalComponents }) {
    if (globalComponents) {
      input.usingComponents = Object.assign({}, globalComponents, input.usingComponents)
    }
    return input
  }

  // 处理支付宝 componentPlaceholder 不支持 view、text 原生标签
  function aliComponentPlaceholderFallback (input) {
    // 处理 驼峰转连字符
    input = componentNameCapitalToHyphen('componentPlaceholder')(input)
    const componentPlaceholder = input.componentPlaceholder
    const usingComponents = input.usingComponents || (input.usingComponents = {})
    for (const cph in componentPlaceholder) {
      const cur = componentPlaceholder[cph]
      const placeholderCompMatched = cur.match(/^(?:view|text)$/g)
      if (!Array.isArray(placeholderCompMatched)) continue
      let compName, compPath
      switch (placeholderCompMatched[0]) {
        case 'view':
          compName = 'mpx-view'
          compPath = mpxViewPath
          break
        case 'text':
          compName = 'mpx-text'
          compPath = mpxTextPath
      }
      usingComponents[compName] = compPath
      componentPlaceholder[cph] = compName
    }
    return input
  }

  // 校验输出支付宝 componentGenerics 配置的正确性
  function aliComponentGenericsValidate (input) {
    const componentGenerics = input.componentGenerics
    if (componentGenerics && typeof componentGenerics === 'object') {
      Object.keys(componentGenerics).forEach(key => {
        if (!componentGenerics[key].default) {
          error(`Ali environment componentGenerics need to specify a default custom component! please check the configuration of component ${key}`)
        }
      })
    }
    return input
  }

  function fillGlobalComponents (input, { globalComponents }, meta) {
    // 通过meta进行globalComponents的透传
    meta.usingComponents = input.usingComponents
    return input
  }

  // 处理 ali swan 的组件名大写字母转连字符：WordExample/wordExample -> word-example
  function componentNameCapitalToHyphen (type) {
    return function (input) {
      // 百度和支付宝不支持大写组件标签名，统一转成带“-”和小写的形式。百度自带标签不会有带大写的情况
      // 后续可能需要考虑这些平台支持 componentGenerics 后的转换 https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/generics.html
      const obj = input[type]
      if (obj) {
        Object.entries(obj).forEach(([k, v]) => {
          const keyNeed = /[A-Z]/g.test(k)
          const valueNeed = /[A-Z]/g.test(v)

          let newK
          let newV

          if (keyNeed) {
            newK = capitalToHyphen(k)
            if (obj[newK]) {
              warn && warn(`Component name "${newK}" already exists, so component "${k}" can't be converted automatically and it isn't supported in ali/swan environment!`)
            } else {
              obj[newK] = v
              delete obj[k]
            }
          }

          // componentPlaceholder 的 value 也需要转换
          if (type === 'componentPlaceholder' && valueNeed) {
            newV = capitalToHyphen(v)
            obj[newK || k] = newV
          }
        })
      }
      return input
    }
  }

  /**
   * 将小程序代码中使用的与原生 HTML tag 或 内建组件 同名的组件进行转化，以解决与原生tag命名冲突问题。
   */
  function fixComponentName (type) {
    return function (input) {
      const usingComponents = input[type]
      if (usingComponents) {
        Object.keys(usingComponents).forEach(tag => {
          if (isOriginTag(tag) || isBuildInTag(tag)) {
            usingComponents[`mpx-com-${tag}`] = usingComponents[tag]
            delete usingComponents[tag]
          }
        })
      }
      return input
    }
  }

  const componentRules = [
    {
      test: 'componentGenerics',
      ali: aliComponentGenericsValidate
    },
    {
      test: 'componentPlaceholder',
      ali: aliComponentPlaceholderFallback,
      swan: deletePath(),
      jd: deletePath()
    },
    {
      test: 'usingComponents',
      web: fixComponentName('usingComponents'),
      ios: fixComponentName('usingComponents'),
      android: fixComponentName('usingComponents')
    },
    {
      test: 'usingComponents',
      ali: componentNameCapitalToHyphen('usingComponents'),
      swan: componentNameCapitalToHyphen('usingComponents')
    },
    {
      swan: addGlobalComponents,
      qq: addGlobalComponents,
      tt: addGlobalComponents,
      jd: addGlobalComponents
    }
  ]

  const windowRules = [
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
      },
      jd: deletePath()
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
      jd: deletePath(),
      swan: deletePath()
    },
    {
      test: 'onReachBottomDistance',
      qq: deletePath(),
      jd: deletePath()
    },
    {
      test: 'disableScroll',
      ali: deletePath(),
      qq: deletePath(),
      jd: deletePath()
    },
    {
      test: 'backgroundColorTop|backgroundColorBottom',
      ali: deletePath(),
      swan: deletePath()
    },
    {
      test: 'navigationBarTextStyle|navigationStyle|backgroundTextStyle',
      ali: deletePath()
    },
    {
      test: 'pageOrientation',
      ali: deletePath(),
      swan: deletePath(),
      tt: deletePath(),
      jd: deletePath()
    }
  ]

  const getTabBarRule = () => (input, { mode }) => {
    input.tabBar = runRules(spec.tabBar, input.tabBar, {
      mode,
      normalizeTest,
      waterfall: true,
      data: {
        pathArr: ['tabBar']
      }
    })
    return input
  }

  const getWindowRule = () => (input, { mode }) => {
    input.window = runRules(spec.window, input.window, {
      mode,
      normalizeTest,
      waterfall: true,
      data: {
        pathArr: ['window']
      }
    })
    return input
  }

  const spec = {
    supportedModes: [
      'ali',
      'swan',
      'qq',
      'tt',
      'jd',
      'qa',
      'dd',
      'web',
      'ios',
      'android'
    ],

    normalizeTest,
    page: [...windowRules, ...componentRules],
    component: componentRules,
    window: windowRules,
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
            input.items = value.map((item) => {
              return runRules(spec.tabBar.list, item, {
                mode: 'ali',
                normalizeTest,
                waterfall: true,
                data: {
                  pathArr: ['tabBar', 'list']
                }
              })
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
          ali: function (input) {
            return changeKey(input, this.test, 'customize')
          },
          swan: deletePath(),
          tt: deletePath(),
          jd: deletePath()
        }
      ]
    },
    rules: [
      {
        test: 'resizable',
        ali: deletePath(),
        qq: deletePath(),
        swan: deletePath(),
        tt: deletePath(),
        jd: deletePath()
      },
      {
        test: 'preloadRule',
        tt: deletePath(),
        jd: deletePath()
      },
      {
        test: 'functionalPages',
        ali: deletePath(true),
        qq: deletePath(true),
        swan: deletePath(true),
        tt: deletePath(),
        jd: deletePath(true)
      },
      {
        test: 'plugins',
        qq: deletePath(true),
        swan: deletePath(true),
        tt: deletePath(),
        jd: deletePath(true)
      },
      {
        test: 'usingComponents',
        web: fixComponentName('usingComponents'),
        ios: fixComponentName('usingComponents'),
        android: fixComponentName('usingComponents')
      },
      {
        test: 'usingComponents',
        ali: componentNameCapitalToHyphen('usingComponents'),
        swan: componentNameCapitalToHyphen('usingComponents')
      },
      {
        test: 'usingComponents',
        qq: fillGlobalComponents,
        swan: fillGlobalComponents,
        tt: fillGlobalComponents,
        jd: fillGlobalComponents
      },
      {
        test: 'usingComponents',
        qq: deletePath({ noLog: true }),
        swan: deletePath({ noLog: true }),
        tt: deletePath({ noLog: true }),
        jd: deletePath({ noLog: true })
      },
      {
        test: 'debug',
        ali: deletePath(),
        swan: deletePath()
      },
      {
        test: 'requiredBackgroundModes',
        ali: deletePath(),
        tt: deletePath()
      },
      {
        test: 'workers',
        jd: deletePath(),
        ali: deletePath(),
        swan: deletePath(),
        tt: deletePath()
      },
      {
        test: 'subpackages|subPackages',
        jd: deletePath(true)
      },
      {
        test: 'packages',
        jd: deletePath()
      },
      {
        test: 'navigateToMiniProgramAppIdList|networkTimeout',
        ali: deletePath(),
        jd: deletePath()
      },
      {
        test: 'tabBar',
        ali: getTabBarRule(),
        qq: getTabBarRule(),
        swan: getTabBarRule(),
        tt: getTabBarRule(),
        jd: getTabBarRule()
      },
      {
        test: 'window',
        ali: getWindowRule(),
        qq: getWindowRule(),
        swan: getWindowRule(),
        tt: getWindowRule(),
        jd: getWindowRule()
      }
    ]
  }
  return spec
}
