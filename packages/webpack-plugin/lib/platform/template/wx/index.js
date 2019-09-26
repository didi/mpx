const runRules = require('../../run-rules')
const getComponentConfigs = require('./component-config')
const normalizeComponentRules = require('../normalize-component-rules')

module.exports = function getSpec ({ warn, error }) {
  const spec = {
    supportedTargets: ['ali', 'swan', 'qq', 'tt'],
    directive: [
      // 特殊指令
      {
        test: /^wx:for$/,
        swan (obj, data) {
          const attrsMap = data.attrsMap
          const varListName = /{{(.*)}}/.exec(obj.value)
          // 在wx:for="abcd"值为字符串时varListName为null,按照小程序循环规则将字符串转换为 ["a", "b", "c", "d"]
          const listName = varListName ? varListName[1] : JSON.stringify(obj.value.split(''))
          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          const keyName = attrsMap['wx:key'] || null
          const keyStr = keyName ? ` trackBy ${itemName}.${keyName}` : ''
          return {
            name: 's-for',
            value: `${itemName}, ${indexName} in ${listName}${keyStr}`
          }
        }
      },
      {
        // 在swan模式下删除key/for-index/for-item
        test: /^wx:(key|for-item|for-index)$/,
        swan () {
          return false
        }
      },
      // 通用指令
      {
        test: /^wx:(.*)$/,
        ali ({ name, value }) {
          const dir = this.test.exec(name)[1]
          return {
            name: 'a:' + dir,
            value
          }
        },
        swan ({ name, value }) {
          const dir = this.test.exec(name)[1]
          return {
            name: 's-' + dir,
            value
          }
        },
        qq ({ name, value }) {
          const dir = this.test.exec(name)[1]
          return {
            name: 'qq:' + dir,
            value
          }
        },
        tt ({ name, value }) {
          const dir = this.test.exec(name)[1]
          return {
            name: 'tt:' + dir,
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
          },
          swan (eventName) {
            const eventArr = ['tap', 'longtap', 'longpress', 'touchstart', 'touchmove', 'touchcancel', 'touchend', 'touchforcechange']
            if (eventArr.includes(eventName)) {
              return eventName
            } else {
              error(`Baidu environment does not support [${eventName}] event!`)
            }
          }
        }
      ]
    }
  }
  spec.rules = normalizeComponentRules(getComponentConfigs({ warn, error }).concat({}), spec)
  return spec
}
