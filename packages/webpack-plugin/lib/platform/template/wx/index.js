const runRules = require('../../run-rules')
const getComponentConfigs = require('./component-config')
const normalizeComponentRules = require('../normalize-component-rules')
const isValidIdentifierStr = require('../../../utils/is-valid-identifier-str')
const templateCompiler = require('../../../template-compiler/compiler')
const parseMustache = templateCompiler.parseMustache
const stringifyWithResolveComputed = templateCompiler.stringifyWithResolveComputed

module.exports = function getSpec ({ warn, error }) {
  const spec = {
    supportedModes: ['ali', 'swan', 'qq', 'tt', 'web', 'qa'],
    // props预处理
    preProps: [],
    // props后处理
    postProps: [
      {
        web ({ name, value }) {
          const parsed = parseMustache(value)
          if (parsed.hasBinding) {
            return {
              name: ':' + name,
              value: parsed.result
            }
          }
        }
      }
    ],
    // 指令处理
    directive: [
      // 特殊指令
      {
        test: 'wx:for',
        swan (obj, data) {
          const attrsMap = data.el.attrsMap
          const parsed = parseMustache(obj.value)
          let listName = parsed.result
          let KEY_TYPES = {
            PROPERTY: 0,
            INDEX: 1
          }
          let keyType = KEY_TYPES.PROPERTY
          // 在wx:for="abcd"值为字符串时varListName为null,按照小程序循环规则将字符串转换为 ["a", "b", "c", "d"]
          if (parsed.hasBinding) {
            // unwrap ()
            listName = listName.slice(1, -1)
            // 处理数字循环
            if (/^\d+$/.test(listName)) {
              keyType = KEY_TYPES.INDEX
              // 创建循环数组
              const loopNum = +listName
              // 定义一个建议值,因为会增加template文件大小,
              if (loopNum > 300) warn(`It's not recommended to exceed 300 in baidu environment`)
              let list = []
              for (let i = 0; i < loopNum; i++) {
                list[i] = i
              }
              listName = JSON.stringify(list)
            }
          } else {
            keyType = KEY_TYPES.INDEX
            // for值为字符串,转成字符数组
            listName = JSON.stringify(parsed.val.split(''))
          }
          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          const keyName = attrsMap['wx:key'] || null
          let keyStr = ''
          if (keyName) {
            const parsed = parseMustache(keyName)
            if (parsed.hasBinding) {
              // keyStr = ` trackBy ${parsed.result.slice(1, -1)}`
            } else if (keyName === '*this') {
              keyStr = ` trackBy ${itemName}`
            } else {
              // 定义key索引
              if (keyType === KEY_TYPES.INDEX) {
                warn(`The numeric type loop variable does not support custom keys. Automatically set to the index value.`)
                keyStr = ` trackBy ${itemName}`
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
        },
        web ({ value }, { el }) {
          const parsed = parseMustache(value)
          const attrsMap = el.attrsMap
          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          return {
            name: 'v-for',
            value: `(${itemName}, ${indexName}) in ${parsed.result}`
          }
        },
        qa ({ value }, { el }) {
          const parsed = parseMustache(value)
          const attrsMap = el.attrsMap
          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          return {
            name: 'for',
            value: `{{(${indexName}, ${itemName}) in ${parsed.result}}}`
          }
        }
      },
      {
        test: 'wx:key',
        swan () {
          return false
        },
        web ({ value }, { el }) {
          // vue的template中不能包含key，对应于小程序中的block
          if (el.tag === 'block') return false
          const itemName = el.attrsMap['wx:for-item'] || 'item'
          const keyName = value
          if (value === '*this') {
            value = itemName
          } else {
            if (isValidIdentifierStr(keyName)) {
              value = `${itemName}.${keyName}`
            } else {
              value = `${itemName}['${keyName}']`
            }
          }
          return {
            name: ':key',
            value
          }
        },
        qa ({ value }, { el }) {
          let parsed = el.attrsMap['wx:key']
          return {
            name: 'tid',
            value: parsed === 'index' ? '$idx' : parsed
          }
        }
      },
      {
        // 在swan/web模式下删除for-index/for-item，转换为v/s-for表达式
        test: /^wx:(for-item|for-index)$/,
        swan () {
          return false
        },
        web () {
          return false
        },
        qa () {
          return false
        }
      },
      {
        test: 'wx:model',
        web ({ value }, { el }) {
          el.hasEvent = true
          const attrsMap = el.attrsMap
          const tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/
          const stringify = JSON.stringify
          const match = tagRE.exec(value)
          if (match) {
            const modelProp = attrsMap['wx:model-prop'] || 'value'
            const modelEvent = attrsMap['wx:model-event'] || 'input'
            const modelValuePathRaw = attrsMap['wx:model-value-path']
            const modelValuePath = modelValuePathRaw === undefined ? 'value' : modelValuePathRaw
            const modelFilter = attrsMap['wx:model-filter']
            let modelValuePathArr
            try {
              modelValuePathArr = JSON.parse(modelValuePath)
            } catch (e) {
              if (modelValuePath === '') {
                modelValuePathArr = []
              } else {
                modelValuePathArr = modelValuePath.split('.')
              }
            }
            let modelValue = match[1].trim()
            return [
              {
                name: ':' + modelProp,
                value: modelValue
              },
              {
                name: 'mpxModelEvent',
                value: modelEvent
              },
              {
                name: '@mpxModel',
                value: `__model(${stringifyWithResolveComputed(modelValue)}, $event, ${stringify(modelValuePathArr)}, ${stringify(modelFilter)})`
              }
            ]
          }
        },
        qa ({ value }, { el }) {
          el.hasEvent = true
          const attrsMap = el.attrsMap
          const tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/
          const stringify = JSON.stringify
          const match = tagRE.exec(value)
          if (match) {
            const modelValuePathRaw = attrsMap['wx:model-value-path']

            const modelValuePath = modelValuePathRaw === undefined ? 'value' : modelValuePathRaw
            const modelFilter = attrsMap['wx:model-filter']
            let modelValuePathArr
            try {
              modelValuePathArr = JSON.parse(modelValuePathRaw)
            } catch (e) {
              if (modelValuePath === '') {
                modelValuePathArr = []
              } else {
                modelValuePathArr = modelValuePath.split('.')
              }
            }
            let modelValue = match[1].trim()
            return [
              {
                name: 'value',
                value: `{{${modelValue}}`
              },
              {
                name: '@input',
                value: `__model(${stringifyWithResolveComputed(modelValue)}, $event, ${stringifyWithResolveComputed(modelValuePathArr)}, ${stringify(modelFilter)})`
              }
            ]
          }
        }
      },
      {
        test: /^wx:(model-prop|model-event|model-value-path|model-filter)$/,
        web () {
          return false
        },
        qa () {
          return false
        }
      },
      {
        // ref只支持字符串字面量
        test: 'wx:ref',
        web ({ value }) {
          return {
            name: 'ref',
            value: `__mpx_ref_${value}__`
          }
        },
        qa ({ value }) {
          return {
            name: 'ref',
            value
          }
        }
      },
      {
        // 样式类名绑定
        test: /^wx:(class|style)$/,
        web ({ name, value }) {
          const dir = this.test.exec(name)[1]
          const parsed = parseMustache(value)
          return {
            name: ':' + dir,
            value: parsed.result
          }
        },
        qa ({ name, value }) {
          // 快应用的 style/class 支持 mustache 语法，直接吧 wx: 干掉就行
          const dir = this.test.exec(name)[1]
          return {
            name: dir,
            value
          }
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
        },
        web ({ name, value }) {
          let dir = this.test.exec(name)[1]
          const parsed = parseMustache(value)
          if (dir === 'elif') {
            dir = 'else-if'
          }
          return {
            name: 'v-' + dir,
            value: parsed.result
          }
        },
        qa ({ name, value }) {
          let dir = this.test.exec(name)[1]
          return {
            name: dir,
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
          const modifierStr = match[3] || ''
          const rPrefix = runRules(spec.event.prefix, prefix, { mode: 'ali' })
          const rEventName = runRules(eventRules, eventName, { mode: 'ali' })
          return {
            name: rPrefix + rEventName.replace(/^./, (matched) => {
              return matched.toUpperCase()
            }) + modifierStr,
            value
          }
        },
        tt ({ name, value }) {
          const match = this.test.exec(name)
          const modifierStr = match[3] || ''
          let ret
          if (match[1] === 'capture-catch' || match[1] === 'capture-bind') {
            const convertName = 'bind'
            warn(`bytedance miniapp doens't support '${match[1]}' and will be translated into '${convertName}' automatically!`)
            ret = { name: convertName + match[2] + modifierStr, value }
          } else {
            ret = { name, value }
          }
          return ret
        },
        swan ({ name, value }, { eventRules }) {
          const match = this.test.exec(name)
          const eventName = match[2]
          runRules(eventRules, eventName, { mode: 'swan' })
        },
        web ({ name, value }, { eventRules, el }) {
          const match = this.test.exec(name)
          const prefix = match[1]
          const eventName = match[2]
          const modifierStr = match[3] || ''
          const meta = {
            modifierStr
          }
          // 记录event监听信息用于后续判断是否需要使用内置基础组件
          el.hasEvent = true
          const rPrefix = runRules(spec.event.prefix, prefix, { mode: 'web', meta })
          const rEventName = runRules(eventRules, eventName, { mode: 'web' })
          return {
            name: rPrefix + rEventName + meta.modifierStr,
            value
          }
        },
        qa ({ name, value }, { el, eventRules }) {
          const match = this.test.exec(name)
          const prefix = match[1]
          const eventName = match[2]
          el.hasEvent = true
          if (match[1] === 'capture-catch' || match[1] === 'capture-bind') {
            warn(`QuickApp doesn't support ${match[1]} event binding on capturing phrase!`)
          }

          let rEventName = runRules(eventRules, eventName, { mode: 'qa' })
          let rPrefix = runRules(spec.event.prefix, prefix, { mode: 'qa' })
          let rt = []
          rt.push({
            name: rPrefix + rEventName,
            value
          })
          if (match[1] === 'catch') {
            // 解决快应用的阻止冒泡
            // 由运行时去处理 e.stopPropagation()
            // el.attrsMap['data-cancelbubble'] = true
            rt.push({
              name: 'data-cancelbubble',
              value: 'true'
            })
          }
          return rt
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
          },
          // 通过meta将prefix转化为modifier
          web (prefix, data, meta) {
            const modifierStr = meta.modifierStr
            const modifierMap = modifierStr.split('.').reduce((map, key) => {
              if (key) {
                map[key] = true
              }
              return map
            }, {})
            switch (prefix) {
              case 'catch':
                modifierMap.stop = true
                break
              case 'capture-bind':
                modifierMap.capture = true
                break
              case 'capture-catch':
                modifierMap.stop = true
                modifierMap.capture = true
                break
            }
            // web中不支持proxy modifier
            delete modifierMap.proxy
            const tempModifierStr = Object.keys(modifierMap).join('.')
            meta.modifierStr = tempModifierStr ? '.' + tempModifierStr : ''
            return '@'
          },
          qa () {
            return '@'
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
          web (eventName) {
            if (eventName === 'touchforcechange') {
              error(`Web environment does not support [${eventName}] event!`)
            }
          },
          qa (eventName) {
            const eventsMap = {
              longtap: 'longpress',
              tap: 'click',
              touchstart: 'touchstart',
              touchmove: 'touchmove',
              touchcancel: 'touchcancel',
              touchend: 'touchend',
              longpress: 'longpress'
            }
            if (eventsMap[eventName]) {
              return eventsMap[eventName]
            } else {
              error(`QuickApp doesn't support the [${eventName}] event!`)
            }
          }
        }
      ]
    }
  }
  spec.rules = normalizeComponentRules(getComponentConfigs({ warn, error }).concat({}), spec)
  return spec
}
