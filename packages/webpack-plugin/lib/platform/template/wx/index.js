const runRules = require('../../run-rules')
const JSON5 = require('json5')
const getComponentConfigs = require('./component-config')
const normalizeComponentRules = require('../normalize-component-rules')
const isValidIdentifierStr = require('../../../utils/is-valid-identifier-str')
const templateCompiler = require('../../../template-compiler/compiler')
const parseMustache = templateCompiler.parseMustache
const stringifyWithResolveComputed = templateCompiler.stringifyWithResolveComputed

module.exports = function getSpec ({ warn, error }) {
  const spec = {
    supportedModes: ['ali', 'swan', 'qq', 'tt', 'web'],
    // props预处理
    preProps: [],
    // props后处理
    postProps: [
      {
        web ({ name, value }) {
          const parsed = parseMustache(value)
          if (parsed.hasBinding) {
            return {
              name: name === 'animation' ? 'v-' + name : ':' + name,
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
          const el = data.el

          const itemName = attrsMap['wx:for-item'] || 'item'
          const indexName = attrsMap['wx:for-index'] || 'index'
          const keyName = attrsMap['wx:key'] || null
          let keyStr = ''
          if (keyName) {
            const parsed = parseMustache(keyName)
            if (parsed.hasBinding) {
            } else if (keyName === '*this') {
              keyStr = ` trackBy ${itemName}`
            } else {
              if (!isValidIdentifierStr(keyName)) {
                keyStr = ` trackBy ${itemName}['${keyName}']`
              } else {
                keyStr = ` trackBy ${itemName}.${keyName}`
              }
            }
          }
          if (el) {
            el.injectWxsProps = {
              injectWxsPath: 'runtime/swanTransFor.wxs',
              injectWxsModuleName: '__swanTransFor__'
            }
          }
          return {
            name: 's-for',
            value: `${itemName}, ${indexName} in __swanTransFor__.processFor(${listName})${keyStr}`
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
              modelValuePathArr = JSON5.parse(modelValuePath)
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
        }
      },
      {
        test: /^wx:(model-prop|model-event|model-value-path|model-filter)$/,
        web () {
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
          }
        }
      ]
    }
  }
  spec.rules = normalizeComponentRules(getComponentConfigs({ warn, error }).concat({}), spec)
  return spec
}
