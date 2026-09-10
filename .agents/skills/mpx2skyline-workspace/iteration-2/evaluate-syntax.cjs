const fs = require('fs')
const path = require('path')
const repo = '/Users/hjw/project/mpx'
const parse = require(repo + '/packages/webpack-plugin/lib/parser')
const setupCompiler = require(repo + '/packages/webpack-plugin/lib/script-setup-compiler')
const babel = require(repo + '/node_modules/@babel/core')
const root = path.resolve(process.argv[2])
const output = path.join(root, 'outputs')
const run = path.join(root, 'run-1')
function files (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? files(file) : [file]
  })
}
async function main () {
  const results = []
  for (const file of files(output).filter(file => file.endsWith('.mpx'))) {
    const result = { file: path.relative(output, file), status: 'passed', scope: 'SFC parsing, JS parsing, JSON parsing and script setup compilation when applicable' }
    try {
      const sfc = parse(fs.readFileSync(file, 'utf8'), { filePath: file, mode: 'wx' })
      if (!sfc.template || !sfc.script) throw new Error('Missing template or script block')
      if (sfc.json) JSON.parse(sfc.json.content)
      let script = sfc.script.content
      result.script_setup = Object.prototype.hasOwnProperty.call(sfc.script.attrs, 'setup')
      if (result.script_setup) {
        const ctorType = result.file.startsWith('pages/') ? 'page' : 'component'
        script = await new Promise((resolve, reject) => {
          Promise.resolve(setupCompiler.call({ resource: `${file}?ctorType=${ctorType}`, resourcePath: file, async: () => (error, content) => error ? reject(error) : resolve(content) }, script)).catch(reject)
        })
      }
      const ast = babel.parseSync(script, { configFile: false, babelrc: false, sourceType: 'module' })
      const unresolved = new Set()
      babel.traverse(ast, { ReferencedIdentifier (p) {
        if (['defineEmits', 'defineExpose', 'defineProps', 'useContext'].includes(p.node.name) && !p.scope.hasBinding(p.node.name)) unresolved.add(p.node.name)
      } })
      if (unresolved.size) throw new Error('Unresolved setup identifiers: ' + Array.from(unresolved).join(', '))
      result.unresolved_setup_identifiers = []
    } catch (error) {
      result.status = 'failed'
      result.error = error.message
    }
    results.push(result)
  }
  const report = { evaluator: 'parent', results, full_application_build: 'not_run', device_validation: 'not_run' }
  fs.writeFileSync(path.join(run, 'evaluator-syntax.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
