const type = require('../../utils/type')

module.exports = function getTargetElRulesRunner ({ target, warn, error }) {
  const componentConfigs = require('./component-config')({
    warn,
    error
  })

  const root = {
    directive: [
      // 通用指令
      {
        test: /^wx:(.*)$/,
        ali ({ name, value }) {
          const dir = this.test.exec(name)[1]
          return {
            name: 'a:' + dir,
            value
          }
        }
      },
      // 事件
      {
        test: /^(bind|catch|capture-bind|capture-catch):?(.*?)(\..*)?$/,
        ali ({ name, value }, { eventRules }) {
          const match = this.test.exec(name)
          const prefix = match[1]
          const eventName = match[2]
          const modifier = match[3] || ''
          const rPrefix = runRules(root.event.prefix, prefix)
          const rEventName = runRules(eventRules, eventName)
          return {
            name: (rPrefix && rEventName) ? rPrefix + rEventName.replace(/^./, (matched) => {
              return matched.toUpperCase()
            }) + modifier : name,
            value
          }
        }
      }
    ],
    event: {
      prefix: [
        {
          ali (prefix) {
            const prefixMap = {
              'bind': 'on',
              'catch': 'catch'
            }
            if (!prefixMap[prefix]) {
              error(`Ali environment does not support [${prefix}] event handling!`)
              return
            }
            return prefixMap[prefix]
          }
        }
      ],
      rules: [
        // 通用冒泡事件
        {
          test: /^(touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange)$/,
          ali (eventName) {
            const eventMap = {
              'touchstart': 'touchStart',
              'touchmove': 'touchMove',
              'touchend': 'touchEnd',
              'touchcancel': 'touchCancel',
              'tap': 'tap',
              'longtap': 'longTap',
              'longpress': 'longTap'
            }
            if (eventMap[eventName]) {
              return eventMap[eventName]
            } else {
              error(`Ali environment does not support [${eventName}] event!`)
            }
          }
        }
      ]
    },
    component: normalizeComponentRules(componentConfigs.concat({}))
  }

  function normalizeTest (rawTest, context) {
    let testType = type(rawTest)
    switch (testType) {
      case 'Function':
        return rawTest.bind(context)
      case 'RegExp':
        return input => rawTest.test(input)
      case 'String':
        return input => rawTest === input
      default:
        return () => true
    }
  }

  function normalizeComponentRules (cfgs) {
    return cfgs.map((cfg) => {
      const result = {}
      if (cfg.test) {
        result.test = cfg.test
      }
      result[target] = function (el) {
        const rTag = cfg[target] && cfg[target].call(this, el.tag)
        if (rTag) {
          el.tag = rTag
        }
        const rAttrsList = []
        const eventRules = (cfg.event || []).concat(root.event.rules)
        el.attrsList.forEach((attr) => {
          const key = 'name'
          const rAttr = runRules(root.directive, attr, key, {
            eventRules,
            attrsList: rAttrsList
          }) || runRules(cfg.props, attr, key, { attrsList: rAttrsList })
          if (Array.isArray(rAttr)) {
            rAttrsList.push(...rAttr)
          } else if (rAttr === false) {
            // delete original attr
          } else {
            rAttrsList.push(rAttr || attr)
          }
        })
        el.attrsList = rAttrsList
        el.attrsMap = require('../compiler').makeAttrsMap(rAttrsList)
        return el
      }
      return result
    })
  }

  function runRules (rules = [], input, testKey, options) {
    rules = rules.rules || rules
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      const tester = normalizeTest(rule.test)
      const testInput = testKey ? input[testKey] : input
      const processor = rule[target]
      if (tester(testInput) && processor) {
        return processor.call(rule, input, options)
      }
    }
  }

  return function (el) {
    runRules(root.component, el, 'tag')
  }
}
