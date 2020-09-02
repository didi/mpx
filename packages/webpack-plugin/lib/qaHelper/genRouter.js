/*
*** 生成manifest文件router&subpackages部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genRouter(projectEntry, pagesMap, defineRouter) {
  let pageKeys = pagesMap && Object.keys(pagesMap)
  let lastIndex = projectEntry.lastIndexOf('/')
  let entryComp = projectEntry.slice(lastIndex + 1)
  let prefix = projectEntry.slice(0, lastIndex)
  let subpackages= `[`
  let routers = `
        "entry": "${prefix}",
        "errorPage": "${defineRouter.errorPage || ''}",`
  /* 
  **** @todo需处理用户在 mpx.plugin.config.js 文件中自定义部分pages
  **** 用户自定义pages部分，用的是mpx项目中相对应组件的name和path,
  **** 如果用户自定义pages中包含 filter和 launchMode，需判断去重
   */
  let needProcessPages = []
  if (defineRouter.pages && Object.keys(defineRouter.pages).length > 0) {
    for(let i in defineRouter.pages) {
      if (defineRouter.pages[i].filter || defineRouter.pages[i].launchMode) {
        needProcessPages.push(defineRouter.pages[i])
      }
    }
  }
  
  // 首页用户自定义pages规则时，合并规则
  let index = needProcessPages.findIndex(item => {
    return item.path.slice(1) === projectEntry
  })
  if (index >= 0) {
    routers += `
        "pages": {
          "${prefix}": {
            "component": "${entryComp}",
            "path": "/${projectEntry}",
            "filter": ${JSON.stringify(needProcessPages[index].filter) || {}},
            "launchMode": "${needProcessPages[index].launchMode || 'standard'}"
          }`
  } else {
    routers += `
        "pages": {
          "${prefix}": {
            "component": "${entryComp}"
          }`
  }
  
  for (let i = 0; i < pageKeys.length; i++) {
    let isSubpackage = pageKeys[i].indexOf('subpackage') > 0
    // 处理pages
    let pagePath = pagesMap[pageKeys[i]]
    if ( pagePath !== projectEntry) {
      let lastIndex = pagePath.lastIndexOf('/')
      let compName = pagePath.slice(lastIndex + 1)
      let prefix = pagePath.slice(0, lastIndex)

      // 与用户自定义pages/options合并
      let index = -1
      if(!isSubpackage) {
        index = needProcessPages.findIndex(item => {
          return item.path.slice(1) === pagePath
        })
      }
      if (index !== -1) {
        routers +=`,
        "${prefix}": {
          "component": "${compName}",
          "path": "/${compName}",
          "filter": ${JSON.stringify(needProcessPages[index].filter) || {}},
          "launchMode": "${needProcessPages[index].launchMode || 'standard'}"
        }`
      } else {
        routers += `,
          "${prefix}": {
            "component": "${compName}"
          }`
      }
    }
    // 处理分包
    if (isSubpackage) {
      let name = pagePath.split('/')[0]
      if (subpackages !== `[`) {
        subpackages += `,
        {
          "name": "${name}",
          "resource": "${name}"
        }`
      } else {
        subpackages += `
        {
          "name": "${name}",
          "resource": "${name}"
        }`
      }
    }
  }
  routers += `
        }`
  return {
    routers,
    subpackages
  }
 }