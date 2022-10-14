import { resolve } from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'

async function run() {
  // fix cjs exports
  const files = await fg('*.js', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: resolve(fileURLToPath(import.meta.url), '../../dist'),
  })
  for (const file of files) {
    let code = await fs.readFile(file, 'utf8')
    code += '\nmodule.exports.default && (module.exports = module.exports.default)'
    await fs.writeFile(file, code)
  }
}

run()
