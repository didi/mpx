const { resolve } = require('./utils')

module.exports = {
  performance: {
    hints: false
  },
  mode: 'none',
  resolve: {
    extensions: ['.mpx', '.js', '.wxml', '.vue', '.ts'],
    modules: ['node_modules']
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      build: [resolve('build/')],
      config: [resolve('config/')]
    },
    cacheDirectory: resolve('.cache/')
  },
  snapshot: {
    // 如果希望修改node_modules下的文件时对应的缓存可以失效，可以将此处的配置改为 managedPaths: []
    managedPaths: [resolve('node_modules/')]
  },
  optimization: {
    minimizer: [
      {
        apply: compiler => {
          // Lazy load the Terser plugin
          const TerserPlugin = require('terser-webpack-plugin')
          new TerserPlugin({
            // terserOptions参考 https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
            terserOptions: {
              // terser的默认行为会把某些对象方法转为箭头函数，导致ios9等不支持箭头函数的环境白屏，详情见 https://github.com/terser/terser#compress-options
              compress: {
                arrows: false
              }
            }
          }).apply(compiler)
        }
      }
    ]
  }
}
