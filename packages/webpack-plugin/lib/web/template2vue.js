const templateCompiler = require('../template-compiler/compiler')
const processTemplate = require('../web/processTemplate')
const { matchCondition } = require('../utils/match-condition')
const parseRequest = require('../utils/parse-request')
const addQuery = require('../utils/add-query')
const { buildComponentsMap } = require('./script-helper')
const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const { shallowStringify } = require('@mpxjs/webpack-plugin/lib/web/script-helper')
const parseQuery = require('loader-utils').parseQuery

const getNameTemplate = function (source, name) { // 对template.wxml文件做截取
  // 使用正则表达式匹配具有 name 的 template 标签及其所有子元素
  // 正则表达式使用非贪婪匹配来递归匹配嵌套的 template
  const regex = new RegExp(`(<template[^>]*\\bname=["|']${name}["|'][^>]*>).*?`, 'g')

  let startIndex = 0
  let endIndex = 0
  const match = regex.exec(source)
  // 逐个处理匹配到的 template 标签及其内容
  if (match) {
    const matchRes = match[0]
    const reg = /<\/?template\s*[^>]*>/g
    let n = 0
    startIndex = match.index
    endIndex = startIndex + matchRes.length
    let html = source.substr(endIndex)
    while (html) {
      const matchRes = html.match(reg)
      if (matchRes.length) {
        const matchTemp = matchRes[0]
        const matchIndex = html.indexOf(matchTemp)
        const matchLength = matchTemp.length
        const cutLength = matchIndex + matchLength
        if (matchTemp.startsWith('</template>')) {
          if (n === 0) {
            endIndex += cutLength
            break
          } else {
            n--
          }
        } else {
          n++
        }
        endIndex += cutLength
        html = html.substr(cutLength)
      }
    }
  } else {
    return ''
  }
  return source.substring(startIndex, endIndex)
}

const getRefVarNames = function (str) { // 获取元素属性上用到的动态数据keyname
  const regex = /\(([a-zA-Z_$]\w*)\)/g

  const matches = str.match(regex) || [];
  const variableNames = matches.map(name => {
    const getName = /\((\w+)\)/.exec(name)
    return getName[1]
  })
  return variableNames
}

const getEventName = function (eventStr) { // 获取事件用到的动态数据keyname
  const regex = /\b(\w+)\s*\(([^)]*?)\)/g
  const regexInParams = /\b(?<!\w+\s)\w+\b(?!\s*["'])/g
  const matches = regex.exec(eventStr)
  const result = []
  if (matches) {
    result.push(matches[1])
    const matchesInParams = matches[2].match(regexInParams)
    result.push(...matchesInParams)
  }
  return result
}

module.exports = function (content) {
  this._compiler = true
  console.log(content, this.resourcePath, '***************')
  const query = parseQuery(this.resourceQuery)
  if (!query.is) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const cutContent = getNameTemplate(content, query.is)
  if (!cutContent) return ''
  const props = []
  const stringifyRequest = r => loaderUtils.stringifyRequest(this, r)
  const { root, meta } = templateCompiler.parse(cutContent, {
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
  let builtInComponentsMap = {}
  if (meta.builtInComponentsMap) {
    Object.keys(meta.builtInComponentsMap).forEach((name) => {
      builtInComponentsMap[name] = {
        resource: addQuery(meta.builtInComponentsMap[name], { isComponent: true })
      }
    })
  }

  const getForValue = function (str) { // 获取v-for中遍历的子对象
    regex = /\(([^)]+)\)/
    let forValue
    const matches = regex.exec(str)
    if (matches) {
      const matchMaps = matches[1].split(',')
      forValue = matchMaps[0]
    }
    return forValue
  }

  function parseText (text, node) {
    const tagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
    if (!tagRE.test(text)) {
      return text
    }
    let forValue
    let parent = node.parent
    while(parent) {
      const value = parent.attrsMap['v-for']
      if (value) {
        forValue = getForValue(value)
        break
      }
      parent = parent.parent
    }
    const tokens = []
    const rawTokens = []
    let lastIndex = (tagRE.lastIndex = 0)
    let match, index, tokenValue
    while ((match = tagRE.exec(text))) {
      index = match.index
      // push text token
      if (index > lastIndex) {
        rawTokens.push((tokenValue = text.slice(lastIndex, index)))
        tokens.push(tokenValue)
      }
      // tag token
      const exp = match[1].trim()
      if (exp !== forValue) {
        props.push(exp)
      }
      lastIndex = index + match[0].length
    }
    return text
  }
  const eventReg = /^@[a-zA-Z]+/
  function serialize (root) {
    function walk (node) {
      let result = ''
      if (node) {
        if (node.type === 3) {
          if (node.isComment) {
            result += '<!--' + node.text + '-->'
          } else {
            result += parseText(node.text, node)
          }
        }
        if (node.type === 1) {
          if (node.tag !== 'temp-node') {
            result += '<' + node.tag
            if (!(node.tag === 'template' && node.attrsMap.name)) {
              let forValue
              let tagProps = []
              node.attrsList.forEach(function (attr) {
                result += ' ' + attr.name
                const value = attr.value
                if (attr.name === 'v-for') {
                  forValue = getForValue(attr.value)
                }
                if (eventReg.exec(attr.name)) { // 事件
                  const result = getEventName(attr.value)
                  tagProps.push(...result)
                } else { // 属性
                  const result = getRefVarNames(value)
                  tagProps.push(...result)
                }
                if (value != null) {
                  result += '=' + templateCompiler.stringifyAttr(value)
                }
              })
              if (forValue) {
                tagProps = tagProps.filter((item) => {
                  return item !== forValue
                })
              }
              props.push(...tagProps)
            }
            if (node.unary) {
              result += '/>'
            } else {
              result += '>'
              node.children.forEach(function (child) {
                result += walk(child)
              })
              result += '</' + node.tag + '>'
            }
          } else {
            node.children.forEach(function (child) {
              result += walk(child)
            })
          }
        }
      }
      return result
    }
    return walk(root)
  }
  const componentsMap = buildComponentsMap({ builtInComponentsMap, loaderContext: this, jsonConfig: {} })
  const template = serialize(root)
  const script = `
  <script>
    import { getComponent } from ${stringifyRequest(optionProcessorPath)}
    export default {
      name: '${query.is}',
      props: ${JSON.stringify([...(new Set(props))])},
      components: ${shallowStringify(componentsMap)}
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


