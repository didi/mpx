const fs = require('fs')
const path = require('path')
const ConcatSource = require('webpack-sources').ConcatSource
const parseComponent = require('../parser')

const genName = (item) => {
  return item.pagePath.replace(/[./]/g, '')
}

const genTargetPath = (item) => {
  return item.pagePath.replace(/(.*pages)/, '..')
}

const arrangeTabBarList = (tabBar, transformPath) => {
  tabBar.list.forEach((item) => {
    item.key = genName(item)
    item.pagePath = transformPath ? genTargetPath(item) : item.pagePath
  })
  return tabBar
}

const genEntryTabContent = (tabBar) => {
  let content = new ConcatSource()
  tabBar.list.forEach((item) => {
    item.key = genName(item)
  })
  content.add('<import name="tab-bar-main" src="./tabBar.ux"></import>')
  content.add(`<template><div class="tabbar-wrapper"><tab-bar-main data='${JSON.stringify(tabBar)}'></tab-bar-main></div></template>`)
  return content
}

const genCustomContent = (tabBar, options) => {
  let content = new ConcatSource()
  let newTabBar = arrangeTabBarList(tabBar, true)
  let tabBarPath = options.projectRoot + '../../custom-tab-bar/index.ux'
  content.add(`<import name="custom-tab-bar" src="${tabBarPath}"></import>\n`)
  newTabBar.list.forEach((item) => {
    content.add(`<import name='${item.key}' src="${item.pagePath}.ux"></import>\n`)
  })
  content.add(`<template>
    <div class="tabbar-wrapper">
      <custom-tab-bar @switchtab="handleSwitch" data='${JSON.stringify(tabBar)}'></custom-tab-bar>
      <div class="tabbar-component">
        <component is='{{componentKey}}'></component>
      </div>
    </div>
  </template>\n`)
  // script
  content = genCustomScript(content, JSON.stringify(newTabBar))
  return content
}

const genCustomScript = (content, tabBar) => {
  content.add('<script>\n')
  content.add(`export default {
    data() {
      let oData = JSON.parse('${tabBar}') || {}
      let initKey = oData.list && oData.list[0] && oData.list[0].key
      return {
        componentKey: initKey,
        tabList: oData.list || []
      }
    },
    handleSwitch(event) {
      let targetPath = event.detail.path.replace(/(.*pages)/, '..')
      this.tabList.forEach((item) => {
        console.log('======', item)
        if (item.pagePath === targetPath) {
          this.componentKey = item.key
        }
      })
    }
  }\n`)
  content.add('</script>\n')
  return content
}

module.exports = function (tabBar, compilation, options) {
  if (tabBar.custom) {
    try {
      let customTabContent = genCustomContent(tabBar, options)
      compilation.assets['pages/tabBar/index' + '.ux'] = customTabContent
    } catch (err) {
      console.log('自定义tabBar custom error', err)
    }
  } else if (tabBar.list) {
    let content = new ConcatSource()
    tabBar.list.forEach((item) => {
      const name = genName(item)
      let targetPath = genTargetPath(item)
      if (targetPath.indexOf('.ux') === -1) {
        targetPath += '.ux'
      }
      content.add(`<import src="${targetPath}" name="${name}"></import>\n`)
    })
    const filePath = path.resolve(__dirname) + '/tabBar.ux'
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) console.log(err)
      try {
        const parts = parseComponent(data, filePath, false, options.mode, options.defs)
        content.add('<template>' + parts.template.content + '</template>\n')
        content.add('<style>' + parts.styles[0].content + '</style>\n')
        content.add('<script>' + parts.script.content + '</script>\n')

        compilation.assets['pages/tabBar/tabBar' + '.ux'] = content
        const entryTabContent = genEntryTabContent(tabBar)
        compilation.assets['pages/tabBar/index' + '.ux'] = entryTabContent
      } catch (err) {
        console.log('tabBar error', err)
      }
    })
  }
}
