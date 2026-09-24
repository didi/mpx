const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')

const WEB_BASE = '/profile-demo/'
const targetMode = process.env.MPX_CURRENT_TARGET_MODE || 'wx'
const defaultPluginOptions = MpxWebpackPlugin.defaultOptions || {}
const defaultWebConfig = defaultPluginOptions.webConfig || {}
const defaultExternalClasses = defaultPluginOptions.externalClasses || ['custom-class']

module.exports = defineConfig({
  // Web 的脚本、样式等静态资源与 history 路由使用同一个部署前缀。
  publicPath: targetMode === 'web' ? WEB_BASE : '/',

  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',

        // 追加业务外部类，避免覆盖 Mpx 已有的 custom-class 等默认配置。
        externalClasses: Array.from(
          new Set([...defaultExternalClasses, 'accent-class'])
        ),

        webConfig: {
          ...defaultWebConfig,
          routeConfig: {
            ...(defaultWebConfig.routeConfig || {}),
            mode: 'history',
            base: WEB_BASE
          }
        }
      },
      loader: {}
    }
  }
})
