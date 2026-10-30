const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const workspace = path.resolve(process.argv[2])
const destination = path.resolve(process.argv[3])
const presetEntry = require.resolve('@mpxjs/unocss-base')
;(async () => {
  fs.mkdirSync(destination, { recursive: true })
  const { createGenerator } = await import(pathToFileURL(require.resolve('@unocss/core', { paths: [path.dirname(presetEntry)] })))
  const { default: presetMpx } = await import(pathToFileURL(presetEntry))
  process.env.MPX_CURRENT_TARGET_MODE = 'ios'
  const generator = await createGenerator({ presets: [presetMpx()] })
  const results = []
  for (const group of ['mpx', 'mpx2rn']) {
    const file = path.join(workspace, 'iteration-18/eval-5-new-task-board-page', group, 'outputs/task-board.mpx')
    const source = fs.readFileSync(file, 'utf8')
    const result = await generator.generate(source)
    fs.writeFileSync(path.join(destination, `eval-5-${group}-uno.css`), result.css)
    results.push({ group, matched: Array.from(result.matched), css_length: result.css.length })
  }
  fs.writeFileSync(path.join(destination, 'uno-checks.json'), JSON.stringify({ results }, null, 2))
  console.log(JSON.stringify(results, null, 2))
})().catch(error => {
  fs.writeFileSync(path.join(destination, 'uno-checks.json'), JSON.stringify({ error: error.stack }, null, 2))
  console.error(error.stack)
  process.exitCode = 1
})
