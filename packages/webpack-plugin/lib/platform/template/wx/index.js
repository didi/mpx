const runRules = require('../../run-rules')
const getComponentConfigs = require('./component-config')
const normalizeComponentRules = require('../normalize-component-rules')

module.exports = function getSpec ({ warn, error }) {
  const spec = {
    supportedTargets: ['ali', 'swan'],
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
          const rPrefix = runRules(spec.event.prefix, prefix, { target: 'ali' })
          const rEventName = runRules(eventRules, eventName, { target: 'ali' }) || eventName
          return {
            name: rPrefix ? rPrefix + rEventName.replace(/^./, (matched) => {
              return matched.toUpperCase()
            }) + modifier : name,
            value
          }
        }
      },
      // 无障碍
      {
        test: /^aria-(role|label)$/,
        ali () {
          warn(`Ali environment does not support aria-role|label props!`)
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
    }
  }
  spec.rules = normalizeComponentRules(getComponentConfigs({ warn, error }).concat({}), spec)
  return spec
}
