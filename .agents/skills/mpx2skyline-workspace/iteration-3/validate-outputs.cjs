const fs = require('fs')
const path = require('path')
const repo = '/Users/hjw/project/mpx'
const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
const babel = require(path.join(repo, 'node_modules/@babel/core'))
const root = __dirname
const manifest = JSON.parse(fs.readFileSync(path.join(repo, '.agents/skills/mpx2skyline-workspace/iteration-3/evals.json'), 'utf8'))
manifest.evals.forEach(item => {
  ;['mpx2skyline', 'no_skill'].forEach(group => {
    const base = path.join(root, `eval-${item.id}-${item.name}`, group)
    const output = path.join(base, 'outputs')
    const files = fs.readdirSync(output).filter(name => /\.(mpx|json|js)$/.test(name))
    if (!files.length) return
    const checks = files.map(name => {
      const target = path.join(output, name)
      try {
        const text = fs.readFileSync(target, 'utf8')
        if (name.endsWith('.mpx')) {
          const sfc = parse(text, { filePath: target, mode: 'wx' })
          if (!sfc.template || !sfc.script || !sfc.json) throw new Error('Missing SFC block')
          babel.parseSync(sfc.script.content, { configFile: false, babelrc: false, sourceType: 'module' })
          JSON.parse(sfc.json.content)
        } else if (name.endsWith('.json')) JSON.parse(text)
        else babel.parseSync(text, { configFile: false, babelrc: false, sourceType: 'module' })
        return { file: name, passed: true }
      } catch (error) { return { file: name, passed: false, error: error.message } }
    })
    fs.writeFileSync(path.join(base, 'run-1/syntax-validation.json'), JSON.stringify({ method: 'repository SFC parser, Babel script parsing, JSON parsing', checks, passed: checks.every(item => item.passed), application_build: 'not_run', device_validation: 'not_run' }, null, 2))
    process.stdout.write(`${item.id}/${group}: ${checks.filter(item => item.passed).length}/${checks.length} syntax checks\n`)
  })
})
