const fs = require('fs')
const path = require('path')
const { pathToFileURL, fileURLToPath } = require('url')
const { registerHooks } = require('module')
const workspace = path.resolve(process.argv[2])
const destination = path.resolve(process.argv[3])
const repo = path.resolve(workspace, '../../..')
const presetRoot = path.join(repo, 'packages/unocss-base')
// The repository preset uses bundler-style extensionless relative imports.
// Resolve those imports only, without altering the preset or its dependencies.
registerHooks({
 resolve (specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL && context.parentURL.startsWith(pathToFileURL(presetRoot).href)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL))
    for (const candidate of [base, base + '.js', path.join(base, 'index.js')]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return nextResolve(pathToFileURL(candidate).href, context)
    }
  }
  return nextResolve(specifier, context)
}
})
;(async () => {
  fs.mkdirSync(destination, { recursive: true })
  const { createGenerator } = await import(pathToFileURL(require.resolve('@unocss/core', { paths: [presetRoot] })))
  const { default: presetMpx } = await import(pathToFileURL(path.join(presetRoot, 'lib/index.js')))
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
