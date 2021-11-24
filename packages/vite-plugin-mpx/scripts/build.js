const execa = require('execa')
const package = require('../package.json')

async function build() {
  await esbuild()
}

const esbuild = (options = []) => {
  const dependencies = Object.keys(package.dependencies) || []
  const peerDependencies = Object.keys(package.peerDependencies) || []
  const externals = [...dependencies, ...peerDependencies]
  return execa(
    'esbuild',
    [
      'src/index.ts',
      '--bundle',
      '--platform=node',
      '--target=node12',
      '--outfile=dist/index.js',
      ...externals.map((v) => `--external:${v}`)
    ],
    { stdio: 'inherit' }
  )
}

async function run() {
  await build()
}

run()
