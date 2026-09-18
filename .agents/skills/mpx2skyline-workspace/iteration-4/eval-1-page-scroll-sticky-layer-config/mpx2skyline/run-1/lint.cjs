const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const out = path.join(__dirname, '../outputs')
const sfc = fs.readFileSync(path.join(out, 'orders.mpx'), 'utf8')
const result = spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '--stdin', '--stdin-filename', 'orders.js', '--config', '.eslintrc.js'], { input: sfc.match(/<script>([\s\S]*?)<\/script>/)[1], encoding: 'utf8' })
process.stdout.write(result.stdout + result.stderr)
console.log('Extracted page script ESLint exit:', result.status)
process.exitCode = result.status
