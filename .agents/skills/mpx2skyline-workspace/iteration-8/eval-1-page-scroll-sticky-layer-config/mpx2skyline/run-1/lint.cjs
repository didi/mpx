const fs = require('fs')
const path = require('path')
const { ESLint } = require('eslint')
const mpx = require('eslint-plugin-mpx')
const js = require('@eslint/js')
const runDir = __dirname
const outputs = path.resolve(runDir, '../outputs')
async function main () {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      js.configs.recommended,
      ...mpx.configs['flat/mpx-essential'],
      {
        files: ['**/*.js', '**/*.mpx'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { wx: 'readonly' } },
        rules: {
          'no-unused-vars': 'error',
          'no-restricted-syntax': ['error', { selector: 'ObjectExpression > SpreadElement', message: 'Use Object.assign for runtime object merging.' }]
        }
      }
    ]
  })
  const results = await eslint.lintFiles([path.join(outputs, 'orders.mpx'), path.join(outputs, 'service.js')])
  fs.writeFileSync(path.join(runDir, 'eslint.json'), JSON.stringify(results, null, 2) + '\n')
  const formatter = await eslint.loadFormatter('stylish')
  console.log(formatter.format(results) || 'ESLint passed: orders.mpx and service.js; 0 errors, 0 warnings.')
  if (results.some(result => result.errorCount || result.warningCount)) process.exitCode = 1
}
main().catch(error => { console.error(error); process.exitCode = 1 })
