module.exports = {
  performance: {
    hints: false
  },
  mode: 'none',
  resolve: {
    extensions: ['.mpx', '.js', '.wxml', '.vue', '.ts'],
    modules: ['node_modules']
  },
  optimization: {
    minimizer: [
      {
        apply: compiler => {
          // Lazy load the Terser plugin
          const TerserPlugin = require('terser-webpack-plugin')
          const SourceMapDevToolPlugin = require('webpack/lib/SourceMapDevToolPlugin')
          const options = compiler.options
          new TerserPlugin({
            cache: true,
            parallel: true,
            sourceMap:
              (options.devtool && /source-?map/.test(options.devtool)) ||
              (options.plugins &&
                options.plugins.some(p => p instanceof SourceMapDevToolPlugin)),
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
