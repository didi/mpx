const userConf = require('./user.conf')

// 可以在此配置mpx webpack plugin
// 配置项文档： https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-options
module.exports = {
  // resolve的模式
  resolveMode: 'webpack' // 可选值 webpack / native，默认是webpack，原生迁移建议使用native
}
