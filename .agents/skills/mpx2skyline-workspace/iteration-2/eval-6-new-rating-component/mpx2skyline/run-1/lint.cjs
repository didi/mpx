const fs = require('fs')
const { ESLint } = require('/Users/hjw/project/mpx/node_modules/eslint')
async function main () {
  const source = fs.readFileSync(require('path').join(__dirname, '../outputs/rating-selector.mpx'), 'utf8')
  const eslint = new ESLint({ cwd: '/Users/hjw/project/mpx', useEslintrc: false, baseConfig: { extends: ['standard'], env: { es6: true }, parserOptions: { ecmaVersion: 2020, sourceType: 'module' } } })
  const results = await eslint.lintText(source.match(/<script>([\s\S]*?)<\/script>/)[1], { filePath: 'rating-selector.js' })
  console.log(JSON.stringify(results, null, 2))
  process.exitCode = results.some(result => result.errorCount || result.warningCount) ? 1 : 0
}
main().catch(error => { console.error(error); process.exitCode = 1 })
