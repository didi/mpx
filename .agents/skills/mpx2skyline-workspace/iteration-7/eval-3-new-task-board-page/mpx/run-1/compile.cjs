const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const compile = require(path.resolve('../mpx/scripts/compile-validate.js'))

async function main () {
  const results = {}
  for (const [name, files, type] of [
    ['page-and-components', ['pages/task-board.mpx'], 'page'],
    ['standalone-components', ['components/rating-selector.mpx', 'components/segmented-control.mpx'], 'component']
  ]) {
    const inputs = files.map(file => path.resolve(__dirname, '../outputs', file))
    const result = await compile(inputs, { target: 'wx', type, projectRoot: process.cwd(), ignoreSubComponents: false, cleanup: false })
    const sourceDir = path.join(os.tmpdir(), 'mpx-compile-validate', crypto.createHash('md5').update(inputs.join('|') + '|wx|' + process.pid).digest('hex'))
    fs.cpSync(sourceDir, path.join(__dirname, 'compiled-wx', name), { recursive: true })
    fs.rmSync(sourceDir, { recursive: true, force: true })
    results[name] = result
  }
  fs.writeFileSync(path.join(__dirname, 'compile-results.json'), JSON.stringify(results, null, 2) + '\n')
  if (Object.values(results).some(result => !result.success)) process.exitCode = 1
}
main().catch(error => { console.error(error); process.exitCode = 1 })
