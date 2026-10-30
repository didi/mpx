const fs = require('fs')
const path = require('path')
const workspace = path.resolve(process.argv[2])
const outputDir = path.resolve(process.argv[3])
const compile = require(path.resolve(workspace, '../../mpx/scripts/compile-validate.js'))
const config = require(path.join(workspace, 'iteration-18/evals.json'))
;(async () => {
  fs.mkdirSync(outputDir, { recursive: true })
  for (const type of ['component', 'page']) {
    const files = config.evals.filter(c => ([1, 5].includes(c.id) ? 'page' : 'component') === type)
      .flatMap(c => ['mpx', 'mpx2rn'].map(g => path.join(workspace, 'iteration-18', `eval-${c.id}-${c.name}`, g, 'outputs', c.outputs[0])))
    const results = await compile(files, { target: ['wx', 'ios'], type, projectRoot: workspace })
    fs.writeFileSync(path.join(outputDir, `compile-${type}.json`), JSON.stringify({ files, results }, null, 2))
    console.log(JSON.stringify({ type, summaries: Object.fromEntries(Object.entries(results).map(([mode, r]) => [mode, r.summary])) }))
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
