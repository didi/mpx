module.exports = {
  // Web 页面和静态资源使用相同的部署前缀。
  publicPath: '/help-demo/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        // 扩展外部类时保留框架的默认约定。
        externalClasses: ['custom-class', 'i-class', 'tone-class'],
        // 只移除阻断 flex 等分布局的 layout-cell Web 宿主节点。
        autoVirtualHostRules: {
          include: /[/\\]src[/\\]components[/\\]layout-cell\.mpx$/
        },
        webConfig: {
          // 固定设计稿换算比例；微信仍保留原 rpx。
          transRpxFn: function (match, value) {
            return Number(value) / 2 + 'px'
          }
        }
      }
    }
  }
}
