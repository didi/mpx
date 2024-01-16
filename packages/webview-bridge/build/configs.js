const path = require('path')
const babel = require('rollup-plugin-babel')
const replace = require('rollup-plugin-replace')
const version = process.env.VERSION || require('../package.json').version
const banner =
`/**
 * mpxjs webview bridge v${version}
 * (c) ${new Date().getFullYear()} @mpxjs team
 * @license Apache
 */`

const resolve = _path => path.resolve(__dirname, '../', _path)

const configs = {
  umdDev: {
    input: resolve('src/index.js'),
    file: resolve('dist/webviewbridge.js'),
    format: 'umd',
    env: 'development'
  },
  umdProd: {
    input: resolve('src/index.js'),
    file: resolve('dist/webviewbridge.min.js'),
    fileName: resolve('../../examples/mpx-webview/H5/webviewbridge.min.js'),
    format: 'umd',
    env: 'production'
  },
  esm: {
    input: resolve('src/index.js'),
    file: resolve('dist/webviewbridge.esm.js'),
    format: 'es'
  },
  'esm-browser-dev': {
    input: resolve('src/index.js'),
    file: resolve('dist/webviewbridge.esm.browser.js'),
    format: 'es',
    env: 'development',
    transpile: false
  },
  'esm-browser-prod': {
    input: resolve('src/index.js'),
    file: resolve('dist/webviewbridge.esm.browser.min.js'),
    format: 'es',
    env: 'production',
    transpile: false
  }
}

function genConfig (opts) {
  const config = {
    input: {
      input: opts.input,
      plugins: [
        replace({
          __VERSION__: version
        })
      ]
    },
    output: {
      banner,
      file: opts.file,
      fileName: opts.fileName,
      format: opts.format,
      name: 'mpx'
    }
  }

  if (opts.env) {
    config.input.plugins.unshift(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  if (opts.transpile !== false) {
    config.input.plugins.push(babel())
  }

  return config
}

function mapValues (obj, fn) {
  const res = {}
  Object.keys(obj).forEach(key => {
    res[key] = fn(obj[key], key)
  })
  return res
}

module.exports = mapValues(configs, genConfig)
