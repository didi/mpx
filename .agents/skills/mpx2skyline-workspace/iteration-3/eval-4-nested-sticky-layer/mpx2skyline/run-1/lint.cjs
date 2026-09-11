const fs = require('fs')
const { ESLint } = require('/Users/hjw/project/mpx/node_modules/eslint')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const source = fs.readFileSync('/private/tmp/skyline-v3-baseline-20260911/eval-4-nested-sticky-layer/mpx2skyline/outputs/category-panel.mpx', 'utf8')
;(async () => {
  const eslint = new ESLint({ cwd: '/Users/hjw/project/mpx' })
  const results = await eslint.lintText(compiler.parseComponent(source, { mode: 'wx' }).script.content, { filePath: '/Users/hjw/project/mpx/category-panel.js' })
  console.log(JSON.stringify(results.map(({ errorCount, warningCount, messages }) => ({ errorCount, warningCount, messages })), null, 2))
  process.exitCode = results.some(result => result.errorCount) ? 1 : 0
})()
