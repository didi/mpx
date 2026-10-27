const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const compileValidate = require('../../../../../mpx/scripts/compile-validate.js')

async function main () {
  const page = path.resolve(__dirname, '../outputs/pages/task-board.mpx')
  const result = await compileValidate(page, {
    target: 'wx',
    type: 'page',
    projectRoot: process.cwd(),
    ignoreSubComponents: false,
    cleanup: false
  })
  fs.writeFileSync(path.join(__dirname, 'compile.json'), JSON.stringify(result, null, 2))
  const buildDir = path.join(os.tmpdir(), 'mpx-compile-validate', crypto.createHash('md5')
    .update(page + '|wx|' + process.pid).digest('hex'))
  fs.cpSync(buildDir, path.join(__dirname, 'compiled'), { recursive: true })
  fs.rmSync(buildDir, { recursive: true, force: true })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.success ? 0 : 1
}

main().catch(error => { console.error(error); process.exitCode = 1 })
