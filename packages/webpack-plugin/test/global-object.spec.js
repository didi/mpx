const path = require('path')
const webpack = require('webpack')
const MpxWebpackPlugin = require('../lib')

async function resolveOutputOptions ({ mode, mpxMode, optimizeSize }) {
  const compiler = webpack({
    mode,
    entry: {},
    output: {
      path: path.resolve(__dirname, 'fixtures/global-object'),
      globalObject: 'globalThis',
      environment: {
        globalThis: true
      }
    },
    plugins: [new MpxWebpackPlugin({
      mode: mpxMode,
      srcMode: 'wx',
      optimizeSize
    })]
  })
  const outputOptions = {
    globalObject: compiler.options.output.globalObject,
    globalThis: compiler.options.output.environment.globalThis
  }
  await new Promise((resolve, reject) => {
    compiler.close((error) => error ? reject(error) : resolve())
  })
  return outputOptions
}

describe('output global object', () => {
  test.each([
    ['serve miniprogram', { mode: 'development', mpxMode: 'wx', optimizeSize: false }, '__mpx_chunk_global__', false],
    ['optimized serve miniprogram', { mode: 'development', mpxMode: 'wx', optimizeSize: true }, '__mpx_chunk_global__', false],
    ['production miniprogram', { mode: 'production', mpxMode: 'wx', optimizeSize: false }, '__mpx_chunk_global__', false],
    ['optimized production miniprogram', { mode: 'production', mpxMode: 'wx', optimizeSize: true }, 'g', false],
    ['web', { mode: 'development', mpxMode: 'web', optimizeSize: false }, 'globalThis', true],
    ['react', { mode: 'development', mpxMode: 'ios', optimizeSize: false }, 'globalThis', true]
  ])('uses the expected value for %s', async (name, options, globalObject, globalThis) => {
    await expect(resolveOutputOptions(options)).resolves.toEqual({ globalObject, globalThis })
  })
})
