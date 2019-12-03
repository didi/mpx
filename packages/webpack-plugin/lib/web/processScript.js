const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const optionProcessorPath = require.resolve('../runtime/optionProcessor')

function shallowStringify (obj) {
  let arr = []
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}

module.exports = function (script, options, callback) {
  const ctorType = options.ctorType
  const builtInComponentsMap = options.builtInComponentsMap
  const localComponentsMap = options.localComponentsMap
  const localPagesMap = options.localPagesMap
  const srcMode = options.srcMode
  const loaderContext = options.loaderContext
  const isProduction = options.isProduction
  const getRequireForSrc = options.getRequireForSrc

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

  let output = '/* script */\n'

  let scriptSrcMode = srcMode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = {
      type: 'script',
      content: ''
    }
    switch (ctorType) {
      case 'app':
        script.content = 'import {createApp} from "@mpxjs/core"\n' +
          'createApp({})\n'
        break
      case 'page':
        script.content = 'import {createPage} from "@mpxjs/core"\n' +
          'createPage({})\n'
        break
      case 'component':
        script.content = 'import {createComponent} from "@mpxjs/core"\n' +
          'createComponent({})\n'
    }
  }
  output += genComponentTag(script, (script) => {
    let content = `import processOption from ${stringifyRequest(`!!${optionProcessorPath}`)}\n`
    // add import
    if (ctorType === 'app') {
      content += `
        import Vue from 'vue'
        import VueRouter from 'vue-router'
        Vue.use(VueRouter)\n
        `
    }
    let firstPage = ''
    const pagesMap = {}
    const componentsMap = {}
    Object.keys(localPagesMap).forEach((pageName, index) => {
      const pageCfg = localPagesMap[pageName]
      const pageVar = `__mpx_page_${index}__`
      const pageRequest = stringifyRequest(pageCfg.resource)
      if (pageCfg.async) {
        content += `const ${pageVar} = ()=>import(${pageRequest})\n`
      } else {
        content += `import ${pageVar} from ${pageRequest}\n`
      }
      if (pageCfg.isFirst) {
        firstPage = pageName
      }
      pagesMap[pageName] = pageVar
    })

    Object.keys(localComponentsMap).forEach((componentName, index) => {
      const componentCfg = localComponentsMap[componentName]
      const componentVar = `__mpx_component_${index}__`
      const componentRequest = stringifyRequest(componentCfg.resource)
      const componentId = componentCfg.id
      if (componentCfg.async) {
        content += `const ${componentVar} = ()=>import(${componentRequest}).then((options)=>{
          options.mpxCid = ${JSON.stringify(componentId)}
          return options
        })\n`
      } else {
        content += `import ${componentVar} from ${componentRequest}\n`
        content += `${componentVar}.mpxCid = ${JSON.stringify(componentId)}\n`
      }
      componentsMap[componentName] = componentVar
    })

    Object.keys(builtInComponentsMap).forEach((componentName, index) => {
      const componentCfg = builtInComponentsMap[componentName]
      const componentVar = `__mpx_built_in_component_${index}__`
      const componentRequest = stringifyRequest(componentCfg.resource)
      content += `import ${componentVar} from ${componentRequest}\n`
      componentsMap[componentName] = componentVar
    })

    content += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)};\n`
    if (!isProduction) {
      content += `global.currentResource = ${JSON.stringify(loaderContext.resourcePath)};\n`
    }
    // 为了正确获取currentSrcMode便于运行时进行转换，对于src引入的组件script采用require方式引入(由于webpack会将import的执行顺序上升至最顶),这意味着对于src引入脚本中的named export将不会生效，不过鉴于mpx和小程序中本身也没有在组件script中声明export的用法，所以应该没有影响
    content += script.src
      ? (getRequireForSrc('script', script) + '\n')
      : (script.content + '\n') + '\n'
    // 配置平台转换通过createFactory在core中convertor中定义和进行
    // 通过processOption进行组件注册和路由注入
    content += `export default processOption(
        global.currentOption,
        ${JSON.stringify(ctorType)},
        ${JSON.stringify(firstPage)},
        ${shallowStringify(pagesMap)},
        ${shallowStringify(componentsMap)}`

    content += ctorType === 'app' ? `,
            Vue,
            VueRouter
          )\n` : `
          )\n`

    return content
  })
  output += '\n'

  callback(null, {
    output
  })
}
