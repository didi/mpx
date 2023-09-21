import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import chalk from 'chalk'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = (p) => path.resolve(packageDir, p)
const pkg = require(resolve('package.json'))

const packageOptions = pkg.buildOptions || {}

const outputConfigs = {
  cjs: {
    file: resolve('dist/index.cjs.js'),
    format: 'cjs'
  },
  'esm-bundler': {
    file: resolve('dist/index.esm-bundler.js'),
    format: 'es'
  }
}

const defaultFormats = ['esm-bundler', 'cjs']
const packageFormats = packageOptions.formats || defaultFormats
const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format])
)

console.log(45657, packageConfigs)

packageFormats.forEach(format => {
  if (format === 'cjs') {
    packageConfigs.push(createProductionConfig(format))
  }
})

function createProductionConfig (format) {
  return createConfig(format, {
    file: resolve(`dist/index.${format}.prod.js`),
    format: outputConfigs[format].format
  })
}

function createConfig (format, output, plugins = []) {
  if (!output) {
    console.log(chalk.yellow(`invalid format: ${format}`))
    process.exit(1)
  }

  output.sourcemap = !!process.env.SOURCE_MAP

  const entryFile = 'src/index.js'

  const treeShakenDeps = ['source-map', '@babel/parser']
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...treeShakenDeps
  ]

  return {
    input: resolve(entryFile),
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      ...plugins
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    },
    treeshake: {
      moduleSideEffects: false
    }
  }
}

export default packageConfigs
