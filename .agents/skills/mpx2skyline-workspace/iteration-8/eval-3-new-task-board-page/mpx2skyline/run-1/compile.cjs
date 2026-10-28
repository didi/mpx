const fs = require('fs')
const path = require('path')
const compileValidate = require('../../../skill-snapshots/mpx/scripts/compile-validate.js')
const runDir = __dirname
const page = path.resolve(runDir, '../outputs/pages/task-board.mpx')
compileValidate(page, { target: 'wx', type: 'page', ignoreSubComponents: false }).then(result => {
  // Preserve compiler findings; timings are collected by the executor.
  delete result.durationMs
  fs.writeFileSync(path.join(runDir, 'compile.json'), JSON.stringify(result, null, 2) + '\n')
  if (!result.success) process.exitCode = 1
}).catch(error => {
  fs.writeFileSync(path.join(runDir, 'compile.json'), JSON.stringify({ success: false, error: error.stack }, null, 2) + '\n')
  process.exitCode = 1
})
