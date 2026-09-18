const fs = require('fs')
const path = require('path')

function resolveManifest (name, root) {
  try {
    return require.resolve(name + '/package.json', { paths: [root] })
  } catch (error) {
    if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error
    let directory = path.dirname(require.resolve(name, { paths: [root] }))
    while (directory !== path.dirname(directory)) {
      const manifest = path.join(directory, 'package.json')
      if (fs.existsSync(manifest) && JSON.parse(fs.readFileSync(manifest, 'utf8')).name === name) return manifest
      directory = path.dirname(directory)
    }
    throw error
  }
}

function inspectBase (webRoot = __dirname, rnRoot = path.resolve(webRoot, '../mpx2rn-workspace')) {
  const web = JSON.parse(fs.readFileSync(path.join(webRoot, 'package.json'), 'utf8'))
  const rn = JSON.parse(fs.readFileSync(path.join(rnRoot, 'package.json'), 'utf8'))
  const errors = []
  const packages = []
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, declared] of Object.entries(web[section])) {
      if (rn[section][name] && rn[section][name] !== declared) errors.push(name + ': 与 RN 的依赖声明不一致')
      try {
        const resolved = resolveManifest(name, webRoot)
        const installed = JSON.parse(fs.readFileSync(resolved, 'utf8'))
        packages.push({ name, declared, installed: installed.version, source: fs.realpathSync(resolved) })
      } catch (error) {
        errors.push(name + ': 尚未安装/无法解析，不能视为编译环境可用')
      }
    }
  }
  const vue = packages.find(item => item.name === 'vue')
  const renderer = packages.find(item => item.name === 'vue-server-renderer')
  if (vue && renderer && vue.installed !== renderer.installed) errors.push('Vue 与 SSR renderer 必须匹配')
  return { status: errors.length ? 'needs_setup' : 'ready', errors, packages, scope: '依赖声明对齐 RN；平台依赖独立安装。该检查不代表编译或运行通过。' }
}

module.exports = { inspectBase }
if (require.main === module) {
  const result = inspectBase()
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.errors.length ? 1 : 0
}
