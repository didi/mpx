const path = require('path')

// 可以在此配置mpx webpack plugin，会assign进build.js里new创建plugin的config里
module.exports = {
  // resolve的模式
  resolveMode: 'webpack', // 可选值 webpack / native，默认是webpack，原生迁移建议使用native

  // 当resolveMode为native时可通过该字段指定项目根目录
  // projectRoot: path.resolve(__dirname, '../src'),

  // 可选值 full / changed，不传默认为change，当设置为changed时在watch模式下将只会对内容发生变化的文件进行写入，以提升小程序开发者工具编译性能
  writeMode: 'changed',

  // 支付宝小程序没有微信小程序类似的组件样式隔离机制，如果遇到样式问题，将本选项置为true将自动为支付宝添加scope，会带来略微的体积上涨
  enableAutoScope: false,

  // 批量指定文件mode，和webpack的rules相同
  modeRules: {},

  // 给模板和json中定义一些全局环境变量
  defs: {}
}
