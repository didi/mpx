const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const projectRoot = require('path').resolve(__dirname, '../../../..')
const compile = require(path.join(projectRoot, 'iteration-3/skill-snapshots/.agents/skills/mpx/scripts/compile-validate.js'))
const page = path.resolve(__dirname, '../fixed-page.mpx')

async function main () {
  const dependencies = {}
  ;['@mpxjs/webpack-plugin', '@mpxjs/core', '@mpxjs/api-proxy', '@mpxjs/mpx-cli-service', 'webpack', 'eslint', 'jest'].forEach(name => {
    const entry = require.resolve(name, { paths: [projectRoot] })
    dependencies[name] = {
      entry: fs.realpathSync(entry),
      version: require(require.resolve(name + '/package.json', { paths: [projectRoot] })).version
    }
  })
  fs.writeFileSync(path.join(__dirname, 'dependencies.json'), JSON.stringify({ node: process.version, projectRoot, dependencies }, null, 2))
  const results = {}
  for (const target of ['wx', 'ali']) {
    results[target] = await compile(page, { target, type: 'page', projectRoot, ignoreSubComponents: false, cleanup: false })
    const hash = crypto.createHash('md5').update(page + '|' + target + '|' + process.pid).digest('hex')
    const temporaryOutput = path.join(os.tmpdir(), 'mpx-compile-validate', hash)
    fs.cpSync(temporaryOutput, path.join(__dirname, target), { recursive: true })
    fs.rmSync(temporaryOutput, { recursive: true, force: true })
  }
  fs.writeFileSync(path.join(__dirname, 'compile-results.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  if (Object.values(results).some(result => !result.success)) process.exitCode = 1
}

main().catch(error => { console.error(error); process.exitCode = 1 })
