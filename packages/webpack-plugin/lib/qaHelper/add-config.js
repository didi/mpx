const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (cnt, options) {
  const appJson = JSON.parse(cnt.children)
  const qa = options.quickapp
  const defaultConfig = {
    package: '',
    name: '',
    icon: 'assets/images/logo.png',
    versionName: '',
    versionCode: 1,
    minPlatformVersion: 1080
  }
  const config = Object.assign({}, defaultConfig, qa || {})
  let finalConfig = JSON.stringify(Object.assign({}, config, appJson), null, 2)
  let content = new ConcatSource(finalConfig)
  return content
}
