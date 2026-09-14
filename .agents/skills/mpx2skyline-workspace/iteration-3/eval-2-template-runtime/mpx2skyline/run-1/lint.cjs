const fs = require('fs')
const { ESLint } = require('/Users/hjw/project/mpx/node_modules/eslint')
const root = '/Users/hjw/project/mpx'
const source = fs.readFileSync(`${__dirname}/../outputs/user-list.mpx`, 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
;(async () => {
  const eslint = new ESLint({ cwd: root, overrideConfig: { parserOptions: { requireConfigFile: false } } })
  const result = await eslint.lintText(script, { filePath: `${root}/skyline-component-check.js` })
  fs.writeFileSync(`${__dirname}/eslint.json`, JSON.stringify(result, null, 2))
  console.log(`ESLint: ${result[0].errorCount} errors, ${result[0].warningCount} warnings`)
  process.exitCode = result[0].errorCount ? 1 : 0
})().catch(error => { console.error(error); process.exitCode = 1 })
