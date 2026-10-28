const fs = require('fs')
const path = require('path')
const { ESLint } = require('eslint')

async function main () {
  const source = fs.readFileSync(path.join(__dirname, '../outputs/style-card.mpx'), 'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  fs.writeFileSync(path.join(__dirname, 'component-script.js'), script)
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { wx: 'readonly' } },
      rules: Object.assign({}, require('@eslint/js').configs.recommended.rules, {
        semi: ['error', 'never'],
        quotes: ['error', 'single'],
        'no-trailing-spaces': 'error'
      })
    }]
  })
  const results = await eslint.lintText(script, { filePath: 'component-script.js' })
  fs.writeFileSync(path.join(__dirname, 'eslint.json'), JSON.stringify(results, null, 2))
  console.log('ESLint:', results[0].errorCount, 'errors,', results[0].warningCount, 'warnings')
  if (results.some(r => r.errorCount)) process.exitCode = 1
}
main().catch(e => { console.error(e); process.exitCode = 1 })
