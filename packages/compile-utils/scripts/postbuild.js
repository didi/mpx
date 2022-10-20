const fs = require('fs').promises
const path= require('path')
const fg = require('fast-glob')

async function run() {
  // fix cjs exports
  const files = await fg('*.js', {
    absolute: true,
    cwd: path.resolve(__dirname, '../dist'),
  })
  for (const file of files) {
    let code = await fs.readFile(file, 'utf8')
    code += '\nmodule.exports.default && (module.exports = module.exports.default)'
    await fs.writeFile(file, code)
  }
}

if(process.argv.find(item => item === 'executive')) {
  run()
}

module.exports = run
