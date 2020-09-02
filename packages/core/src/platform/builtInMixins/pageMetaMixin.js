// https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html

function makeMap (arr) {
  return arr.reduce((map, item) => {
    map[item] = true
    return map
  }, {})
}

function setNavigationBarBackgroundColor (color) {
  if (!color) {
    return
  }

  const appCapableName = 'apple-mobile-web-app-capable'
  if (!document.querySelector(`meta[name="${appCapableName}"]`)) {
    const tag = document.createElement('meta')
    tag.setAttribute('name', appCapableName)
    tag.setAttribute('content', 'yes')
    document.head.insertBefore(tag, document.head.firstChild)
  }

  // 目前仅在 ios 的 safari 浏览器的全屏模式下中有效果
  // 且仅支持以下三个值，如果使用其他值，则浏览器默认显示为 black
  const contentMap = makeMap([
    'default',
    'black',
    'black-translucent'
  ])

  const barStyleName = 'apple-mobile-web-app-status-bar-style'
  let barStyle = document.querySelector(`meta[name="${barStyleName}"]`)
  if (!barStyle) {
    barStyle = document.createElement('meta')
    barStyle.setAttribute('name', barStyleName)
  }

  barStyle.setAttribute('content', contentMap[color] || 'default')
}

export default function pageMetaMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      activated () {
        setNavigationBarBackgroundColor(this.$options.__mpxPageConfig.navigationBarBackgroundColor)
      }
    }
  }
}
