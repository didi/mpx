const runRules = require('../../run-rules')
const getComponentConfigs = require('./component-config')
const normalizeComponentRules = require('../normalize-component-rules')
const isValidIdentifierStr = require('../../../utils/is-valid-identifier-str')

module.exports = function getSpec ({ warn, error }) {
  const spec = {
    supportedTargets: ['ali', 'swan', 'qq', 'tt', 'web'],
    directive: [
      // 特殊指令
      {
        test: /^wx:for$/,
        swan (obj, data) {
          const attrsMap = data.attrsMap
          const varListName = /{{(.*)}}/.exec(obj.value)
          let listName = ''
          let varIsNumber = false
          let KEY_TYPES = {
            PROPERTY: 0,
            INDEX: 1
          }
          let keyType = KEY_TYPES.PROPERTY
          // 在wx:for="abcd"值为字符串时varListName为null,按照小程序循环规则将字符串转换为 ["a", "b", "c", "d"]
          if (varListName) {
            const variableName = varListName[1].trim()
            varIsNumber = variableName.match(/^\d+$/)
            // 如果为{{}}中为数字字面量
            if (varIsNumber) {
              keyType = KEY_TYPES.INDEX
              // 创建循环数组
              const loopNum = Math.ceil(Number(variableName))
              // 定义一个建议值,因为会增加template文件大小,
              if (loopNum > 300) warn(`It's not recommended to exceed 300 in baidu environment`)
              let list = []
              for (let i = 0; i < loopNum; i++) {
                list[i] = i
              }
              listName = JSON.stringify(list)
              warn(`Number type loop variable is not support in baidu environment, please check variable: ${variableName}`)
            } else {
              listName = varListName[1]
            }
          } else {
            keyType = KEY_TYPES.INDEX
            // for值为字符串,转成字符数组
            listName = JSON.stringify(obj.value.split(''))
          }
          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          const keyName = attrsMap['wx:key'] || null
          let keyStr = ''
          if (keyName &&
                        // 百度不支持在trackBy使用mustache语法
                        !/{{[^}]*}}/.test(keyName)
          ) {
            if (keyName === '*this') {
              keyStr = ` trackBy ${itemName}`
            } else {
              // 定义key索引
              if (keyType === KEY_TYPES.INDEX) {
                warn(`The numeric type loop variable does not support custom keys. Automatically set to the index value.`)
                keyStr = ` trackBy ${itemName}[${indexName}]`
              } else if (keyType === KEY_TYPES.PROPERTY && !isValidIdentifierStr(keyName)) {
                keyStr = ` trackBy ${itemName}['${keyName}']`
              } else if (keyType === KEY_TYPES.PROPERTY) {
                keyStr = ` trackBy ${itemName}.${keyName}`
              } else {
                // 以后增加其他key类型
              }
            }
          }
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
        },
        tt ({ name, value }) {
          const match = this.test.exec(name)
          const modifier = match[3] || ''
          let ret
          if (match[1] === 'capture-catch' || match[1] === 'capture-bind') {
            const convertName = 'bind'
            warn(`bytedance miniapp doens't support '${match[1]}' and will be translated into '${convertName}' automatically!`)
            ret = { name: convertName + match[2] + modifier, value }
          } else {
            ret = { name, value }
          }
          return ret
        },
        swan ({ name, value }, { eventRules }) {
          const match = this.test.exec(name)
          const eventName = match[2]
          runRules(eventRules, eventName, { target: 'swan' })
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
            const eventArr = ['tap', 'longtap', 'longpress', 'touchstart', 'touchmove', 'touchcancel', 'touchend', 'touchforcechange', 'transitionend', 'animationstart', 'animationiteration', 'animationend']
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
