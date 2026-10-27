const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const run = __dirname
const workspace = path.resolve(run, '../../../..')
const input = path.resolve(run, '../outputs/user-list.mpx')
process.env.TMPDIR = path.join(run, 'grader-tmp')
fs.mkdirSync(process.env.TMPDIR, { recursive: true })
const compileValidate = require(path.resolve(workspace, '../mpx/scripts/compile-validate.js'))
compileValidate(input, { target: 'wx', type: 'component', cleanup: false }).then(result => {
  const hash = crypto.createHash('md5').update(input + '|wx|' + process.pid).digest('hex')
  const outDir = path.join(process.env.TMPDIR, 'mpx-compile-validate', hash)
  const files = []
  const capture = path.join(run, 'grader-compiled')
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(file)
    const rel = path.relative(outDir, file)
    files.push({ path: rel, bytes: fs.statSync(file).size })
    if (/\.(wxml|wxss|json)$/.test(file)) {
      const dest = path.join(capture, rel)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(file, dest)
    }
  })
  walk(outDir)
  const evidence = { kind: 'grader-real-wx-compilation', result, files, capturedDirectory: capture, device: 'not_run' }
  fs.writeFileSync(path.join(run, 'grader-compile.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence, null, 2))
  if (!result.success) process.exitCode = 1
}).catch(error => { console.error(error); process.exitCode = 1 })
