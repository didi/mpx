module.exports = {
  // Web 页面与静态资源分别配置前缀；服务器需将 /help-demo/ 下的页面路由回退到应用 HTML。
  publicPath: process.env.MPX_CLI_MODE === 'web' ? '/help-demo/' : '/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        // 自定义数组替换默认值，保留 custom-class 与 i-class 的外部类约定。
        externalClasses: ['custom-class', 'i-class', 'tone-class'],
        // 只让布局单元的真实根节点直接参与横向 flex 布局。
        autoVirtualHostRules: {
          include: /[\\/]src[\\/]components[\\/]layout-cell\.mpx$/
        },
        webConfig: {
          // 固定 2rpx = 1 CSS px，样式区块与内联样式均使用同一换算。
          transRpxFn: function (match, value) {
            return Number(value) / 2 + 'px'
          }
        }
      }
    }
  }
}
