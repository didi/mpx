const isWeb = process.env.MPX_CURRENT_TARGET_MODE === 'web'

module.exports = {
  publicPath: isWeb ? '/help-demo/' : '/',
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        webConfig: {
          // Web 设计稿仍按 750rpx 计，但不随视口伸缩：1rpx 恒等于 0.5 CSS px。
          transRpxFn (match, value) {
            if (value === '0') return value
            return `${Number(value) / 2}px`
          }
        }
      }
    }
  }
}

/*
 * Web 部署约定：静态资源发布在 /help-demo/；history 路由要求生产服务器把
 * /help-demo/ 下无法命中静态文件的请求回退到 /help-demo/index.html。
 * app.json 的 workers 只由小程序产物复制/注册；Web 不会自动生成浏览器 Worker。
 * Web 会把两个小程序分包页注册成异步路由，但 independent 隔离和 preloadRule
 * 都是小程序运行时语义，不会成为 Web 的独立运行时或预下载策略。
 */
