const templateCompiler = require('../template-compiler/compiler')
const parseRequest = require('../utils/parse-request')
const addQuery = require('../utils/add-query')
const { buildComponentsMap } = require('./script-helper')
const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const domTagConfig = require('../utils/dom-tag-config')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const shallowStringify = require('../utils/shallow-stringify')
const { stringifyRequest } = require('./script-helper')
const parseQuery = require('loader-utils').parseQuery
const wxmlTemplateLoader = normalize.lib('web/wxml-template-loader')

const getRefVarNames = function (str = '', discardProp) { // 获取元素属性上用到的动态数据keyname
  const regex = /\(([a-zA-Z_$]\w*)\)/g
  const matches = str.match(regex) || []
  const variableNames = []
  matches.forEach(name => {
    const getName = /\((\w+)\)/.exec(name)
    if (!discardProp.includes(getName[1]) && getName[1]) {
      variableNames.push(getName[1].trim())
    }
  })
  return variableNames
}

const getTextVarName = function (str = '', discardProp) { // 获取文本中的动态数据keyname
  const regex = /\{\{([^{}]+?)(?:\..*?)?\}\}/g
  const variables = []
  let match

  while ((match = regex.exec(str)) !== null) {
    const inner = match[1] // 匹配 {{...}} 内部内容
    const varName = inner.split('.')[0]
    if (!discardProp.includes(varName) && varName) {
      variables.push(varName.trim())
    }
  }
  return variables
}

// 不是所有的元素都有:class，scoped id需要加到class上才能生效，所以检测如果没有的情况做个补充
const addBindClassHandle = function (attrList) {
  const hasBindClass = attrList.some((item) => {
    return item.name === ':class'
  })
  if (!hasBindClass) {
    attrList.push({ name: ':class', value: '' })
  }
}
// 所有的props是在遍历模版的时候收集的，需要把true/false/for上面定义的item index剔除掉
const addDiscardProp = function (attrList, discardProp) {
  for (let i = 0; i < attrList.length; i++) {
    if (attrList[i].name === 'v-for') {
      const regex = /\(([^)]+)\)/
      const match = attrList[i].value?.match(regex)
      if (match) {
        const discardValue = match[1].split(',').map(s => s.trim()) || []
        discardProp.push(...discardValue)
      }
    }
  }
}

const getEventName = function (eventStr = '') { // 获取事件用到的动态数据keyname 返回数组是避免将空值写入prop
  const match = eventStr.match(/\[\[\s*"([^"]*)"\s*\]\]/)
  if (match) {
    const extractedValue = match[1]
    const trimmedValue = extractedValue
    return [trimmedValue]
  }
  return []
}

module.exports = function (content) {
  const mpx = this.getMpx()
  const {
    wxsContentMap,
    projectRoot
  } = mpx
  this._compiler = true
  const query = parseQuery(this.resourceQuery)
  if (!query.is) {
    return content
  }
  let parentLocalComponentsMap = {}
  try {
    parentLocalComponentsMap = JSON.parse(query.localComponentsMap) // 拿取父组件上面的所有本地组件
  } catch (e) {}
  const { resourcePath, rawResourcePath } = parseRequest(this.resource)
  const props = ['_data_v_id']
  const { root, meta } = templateCompiler.parse(content, { // 调用已有的parse方法处理模版
    warn: (msg) => {
      this.emitWarning(
        new Error('[template compiler][' + this.resource + ']: ' + msg)
      )
    },
    error: (msg) => {
      this.emitError(
        new Error('[template compiler][' + this.resource + ']: ' + msg)
      )
    },
    mode: 'web',
    srcMode: 'wx',
    wxmlName: query.is,
    filePath: resourcePath,
    usingComponents: []
  })
  const builtInComponentsMap = {}
  if (meta.builtInComponentsMap) {
    Object.keys(meta.builtInComponentsMap).forEach((name) => {
      builtInComponentsMap[name] = {
        resource: addQuery(meta.builtInComponentsMap[name], { isComponent: true })
      }
    })
  }

  if (meta.wxsContentMap) {
    for (const module in meta.wxsContentMap) {
      wxsContentMap[`${rawResourcePath}~${module}`] = meta.wxsContentMap[module]
    }
  }

  const eventReg = /^@[a-zA-Z]+/
  let isFindRoot = false
  const componentNames = [] // 记录引用多少个组件
  const localComponentsTags = []
  function serialize (root) {
    function walk (node, discardProp) {
      let result = ''
      if (node) {
        if (node.type === 3) {
          if (node.isComment) {
            result += '<!--' + node.text + '-->'
          } else {
            const text = getTextVarName(node.text, discardProp) || []
            props.push(...text)
            result += node.text
          }
        }
        if (node.type === 1) {
          if (node.tag === 'wxs' || node.tag === 'import') { // wxml文件里不支持import wxs后续支持
            return ''
          } else if (node.tag !== 'temp-node') {
            if (node.tag === 'template' && !node._fakeTemplate) {
              if (node.attrsMap.name) { // template name处理逻辑
                if (isFindRoot) {
                  componentNames.push(node.attrsMap.name)
                  return ''
                }
                isFindRoot = true
                result += '<' + node.tag
              } else if (node.attrsMap.is) { // template is处理逻辑
                node.tag = 'component'
                result += '<' + node.tag
                node.attrsList.forEach((item) => {
                  if (item.name === 'is') {
                    item.name = ':is'
                    item.value = `'${item.value}'`
                  }
                  if (item.name === ':data') {
                    item.name = 'v-bind'
                    const bindValue = item.value.replace(/\(|\)/g, '')
                    item.value = bindValue ? `{${bindValue}, _data_v_id}` : '{ _data_v_id }'
                    // 获取props 清掉传入是写的空格
                    props.push(...bindValue.split(',').map((item) => item?.trim()))
                  }
                  result += ' ' + item.name
                  const value = item.value
                  if (value != null) {
                    result += '=' + templateCompiler.stringifyAttr(value)
                  }
                })
              } else { // 其他template逻辑全部丢弃
                return ''
              }
            } else {
              const { isBuildInTag, isOriginTag } = domTagConfig
              if (!isBuildInTag(node.tag) && !isOriginTag(node.tag)) {
                localComponentsTags.push(node.tag)
              }
              result += '<' + node.tag
              const tagProps = []
              addBindClassHandle(node.attrsList)
              addDiscardProp(node.attrsList, discardProp)
              node.attrsList.forEach(function (attr) {
                if (attr.name === ':class') {
                  if (attr.value.trim().startsWith('[') && attr.value.trim().endsWith(']')) { // 数组情况下_data_v_id直接插在最后面
                    attr.value = attr.value.replace(']', ', _data_v_id]')
                  } else if (attr.value) {
                    attr.value = `[${attr.value}, _data_v_id]` // 非数组情况下包装成数组后_data_v_id直接插在最后面
                  } else {
                    attr.value = '[_data_v_id]'
                  }
                }
                const value = attr.value
                if (eventReg.exec(attr.name)) { // 事件
                  const result = getEventName(attr.value)
                  tagProps.push(...result)
                } else { // 属性
                  const result = getRefVarNames(value, discardProp)
                  tagProps.push(...result)
                }
                result += ' ' + attr.name
                if (value != null) {
                  result += '=' + templateCompiler.stringifyAttr(value)
                }
              })
              props.push(...tagProps)
            }
            if (node.unary) {
              result += '/>'
            } else {
              result += '>'
              node.children.forEach(function (child) {
                result += walk(child, discardProp)
              })
              result += '</' + node.tag + '>'
            }
          } else {
            node.children.forEach(function (child) {
              result += walk(child, discardProp)
            })
          }
        }
      }
      discardProp.splice(2) // 清理掉本次循环记录的数据避免污染其他同级的props判断
      return result
    }
    return walk(root, ['true', 'false'])
  }
  const tempCompMaps = []
  const path = this.resourcePath || ''
  const template = serialize(root)
  componentNames.forEach((item) => {
    tempCompMaps[item] = {
      resource: `${path.replace(query.is, item)}?is=${item}&isTemplate`
    }
  })

  const localComponentsMap = {}
  localComponentsTags.forEach((item) => { // 做一次过滤避免不必要的自定义组件加载
    localComponentsMap[item] = parentLocalComponentsMap[item]
  })

  const componentsMap = buildComponentsMap({ localComponentsMap, builtInComponentsMap, loaderContext: this, jsonConfig: {} })
  let script = `\n<script>\n
    import proxyEventMixin from '@mpxjs/core/src/platform/builtInMixins/proxyEventMixin.web.js'
    import MpxProxy from '@mpxjs/core/src/core/proxy.js'
    const {getComponent} = require(${stringifyRequest(this, optionProcessorPath)})\n`
  script += 'const templateModules = {}\n'
  meta.templateSrcList?.forEach((item) => {
    script += `
          const tempLoaderResult = require(${stringifyRequest(this, `!!${wxmlTemplateLoader}!${item}`)})\n
          Object.assign(templateModules, tempLoaderResult)\n`
  })

  // 注入wxs模块
  const wxsModuleMap = meta.wxsModuleMap
  script += '  var wxsModules = {}\n'
  const finalProp = [...(new Set(props))]
  if (wxsModuleMap) {
    Object.keys(wxsModuleMap).forEach((module) => {
      const src = loaderUtils.urlToRequest(wxsModuleMap[module], projectRoot)
      const expression = `require(${stringifyRequest(this, src)})`
      const index = finalProp.indexOf(module)
      if (index > -1) { // 干掉模版中收集的wxs的字段
        finalProp.splice(index, 1)
      }
      script += `  wxsModules.${module} = ${expression}\n`
    })
  }
  script += `export default {
      name: '${query.is}',
      props: ${JSON.stringify(finalProp)},
      mixins: [proxyEventMixin()],
      beforeCreate () {
        this.__mpxProxy = new MpxProxy({}, this, true)
        this.__mpxProxy.created()
        Object.keys(wxsModules).forEach((key) => {
          if (key in this) {
            console.error('[Mpx runtime error]: The wxs module key ['+key+'}] exist in the component/page instance already, please check and rename it!')
          } else {
            this[key] = wxsModules[key]
          }
        })
      },
      components: Object.assign(${shallowStringify(componentsMap)}, templateModules),
    }
  </script>`
  const text = template + script
  if (query.type === 'template') {
    return template
  } else if (query.type === 'script') {
    return script
  } else {
    return text
  }
}
