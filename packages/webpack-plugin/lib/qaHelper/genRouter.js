/*
*** 生成manifest文件router&subpackages部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genRouter(projectEntry, pagesMapArray) {
  let lastIndex = projectEntry.lastIndexOf('/')
  let entryComp = projectEntry.slice(lastIndex + 1)
  let prefix = projectEntry.slice(0, lastIndex)
  let subpackages= `[`

  let routers = `
        "entry": "${prefix}",
        "pages": {
          "${prefix}": {
            "component": "${entryComp}"
          }`
  for (let i = 0; i < pagesMapArray.length; i++) {
    if (pagesMapArray[i] !== projectEntry) {
      let lastIndex = pagesMapArray[i].lastIndexOf('/')
      let compName = pagesMapArray[i].slice(lastIndex + 1)
      let prefix = pagesMapArray[i].slice(0, lastIndex)

      routers += `,
          "${prefix}": {
            "component": "${compName}"
          }`
    }
    let isSubpackage = pagesMapArray[i].split('/')[0] !== 'pages'
    if (isSubpackage) {
      let name = pagesMapArray[i].split('/')[0]
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