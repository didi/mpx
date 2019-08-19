const path = require('path')

// 可以在此配置mpx webpack plugin，会assign进build.js里new创建plugin的config里
module.exports = {
  // 可通过该字段指定项目根目录
  // projectRoot: path.resolve(__dirname, '../src'),

  // resolve的模式
  resolveMode: 'webpack' // 可选值 webpack / native，默认是webpack，原生迁移建议使用native
}
