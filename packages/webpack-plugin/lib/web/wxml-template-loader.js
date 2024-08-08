// input: <template name="staffName">
//   <view>
//     FirstName{{firstName}}
//   </view>
// </template>
// <template name="staffNameB">
//   <view>
//     FirstName{{firstName}}
//   </view>
// </template>


// output: {
//   staffName:require('xxx.vue!=!temp2vue!template.wxml?is=staffName')
//   staffNameB:require('temp2vue!template.wxml?is=staffNameB')
// }
const normalize = require('@mpxjs/webpack-plugin/lib/utils/normalize')
const template2vue = normalize.lib('web/template2vue.js')
const loaderUtils = require('loader-utils')
const hash = require('hash-sum')
const VirtualModulesPlugin = require('webpack-virtual-modules')
const virtualModules = new VirtualModulesPlugin()
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const { shallowStringify } = require('./script-helper')

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

module.exports = function (content) {
  const regex = /<template[^>]*\sname\s*=\s*"([^"]*)"[^>]*>/g;
  const query = loaderUtils.parseQuery(this.query)
  let match;
  const templateNames = [];
  const output = {}

  while ((match = regex.exec(content)) !== null) {
    // match[1] 是属性 'name' 的值
    templateNames.push(match[1])
  }
  const tempLen = templateNames.length
  const templateMaps = {}
  const loaderContext = { ...this, context: query.context}
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  templateNames.forEach((name, index) => {
    const cutContent = getNameTemplate(content, name)
    const hashValue = hash(this.resourcePath)
    const fileName = `template/${name}-${hashValue}`
    const last = tempLen - 1 === index
    const resourcePath = this.resourcePath.replace(/.wxml$/, `-${name}.wxml`)
    console.log(cutContent, '------------')
    virtualModules.writeModule(resourcePath, cutContent)
    templateMaps[name] = `getComponent(require(${loaderUtils.stringifyRequest(loaderContext, `${resourcePath}?is=${name}`)}))`
    // templateMaps[name] = loaderUtils.stringifyRequest(loaderContext, `${this.resourcePath}?is=${name}`)

    // templateMaps[name] = `getComponent(require(${loaderUtils.stringifyRequest(loaderContext, `${this.context}/${fileName}.vue!=!${template2vue}!${this.resourcePath}?is=${name}`)}))`
  })
  return `
  const {getComponent} = require(${stringifyRequest(optionProcessorPath)})\n
  module.exports = ${shallowStringify(templateMaps)}
  `
  // return `
  //   module.exports = ${shallowStringify(templateMaps)}
  // `
}
