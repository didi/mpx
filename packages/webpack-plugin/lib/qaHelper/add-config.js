const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (cnt, options) {
  const appJson = JSON.parse(cnt.children)
  const qa = options.quickapp
  let config = {
    package: qa && qa.package || '',
    name: qa && qa.name || '',
    versionName: qa && qa.versionName || '',
    versionCode: qa && qa.versionCode || 1,
    minPlatformVersion: qa && qa.minPlatformVersion || 1080
  }
  let finalConfig = JSON.stringify(Object.assign({}, appJson, config), null, 2)
  let content = new ConcatSource(finalConfig)
  return content
}