const pluginutils = require('@rollup/pluginutils')
const config = require('@unocss/config')
const core = require('@unocss/core')
const node_path = require('node:path')
const MagicString = require('magic-string')
const remapping = require('@ampproject/remapping')
const node_crypto = require('node:crypto')

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e }

const MagicString__default = /* #__PURE__ */_interopDefaultLegacy(MagicString)
const remapping__default = /* #__PURE__ */_interopDefaultLegacy(remapping)

const INCLUDE_COMMENT = '@unocss-include'
const IGNORE_COMMENT = '@unocss-ignore'
const CSS_PLACEHOLDER = '@unocss-placeholder'

const defaultExclude = [core.cssIdRE]
const defaultInclude = [/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/]

function createContext (configOrPath, defaults = {}, extraConfigSources = [], resolveConfigResult = () => {
}) {
  let root = process.cwd()
  let rawConfig = {}
  let configFileList = []
  const uno = core.createGenerator(rawConfig, defaults)
  let rollupFilter = pluginutils.createFilter(defaultInclude, defaultExclude)
  const invalidations = []
  const reloadListeners = []
  const modules = new core.BetterMap()
  const tokens = /* @__PURE__ */ new Set()
  const tasks = []
  const affectedModules = /* @__PURE__ */ new Set()
  let ready = reloadConfig()
  async function reloadConfig () {
    const result = await config.loadConfig(root, configOrPath, extraConfigSources, defaults)
    resolveConfigResult(result)
    rawConfig = result.config
    configFileList = result.sources
    uno.setConfig(rawConfig)
    uno.config.envMode = 'dev'
    rollupFilter = pluginutils.createFilter(
      rawConfig.include || defaultInclude,
      rawConfig.exclude || defaultExclude
    )
    tokens.clear()
    await Promise.all(modules.map((code, id) => uno.applyExtractors(code, id, tokens)))
    invalidate()
    dispatchReload()
    const presets = /* @__PURE__ */ new Set()
    uno.config.presets.forEach((i) => {
      if (!i.name) { return }
      if (presets.has(i.name)) { console.warn(`[unocss] duplication of preset ${i.name} found, there might be something wrong with your config.`) } else { presets.add(i.name) }
    })
    return result
  }
  async function updateRoot (newRoot) {
    if (newRoot !== root) {
      root = newRoot
      ready = reloadConfig()
    }
    return await ready
  }
  function invalidate () {
    invalidations.forEach((cb) => cb())
  }
  function dispatchReload () {
    reloadListeners.forEach((cb) => cb())
  }
  async function extract (code, id) {
    if (id) { modules.set(id, code) }
    const len = tokens.size
    await uno.applyExtractors(code, id, tokens)
    if (tokens.size > len) {
      this.emitFile(id, '', undefined, {
        skipEmit: true,
        unocssTokens: new Set(tokens)
      })
      invalidate()
    }
  }
  function filter (code, id) {
    if (code.includes(IGNORE_COMMENT)) { return false }
    return code.includes(INCLUDE_COMMENT) || code.includes(CSS_PLACEHOLDER) || rollupFilter(id.replace(/\?v=\w+$/, ''))
  }
  async function getConfig () {
    await ready
    return rawConfig
  }
  async function flushTasks () {
    const _tasks = [...tasks]
    await Promise.all(_tasks)
    tasks.splice(0, _tasks.length)
  }
  return {
    get ready () {
      return ready
    },
    tokens,
    modules,
    affectedModules,
    tasks,
    flushTasks,
    invalidate,
    onInvalidate (fn) {
      invalidations.push(fn)
    },
    filter,
    reloadConfig,
    onReload (fn) {
      reloadListeners.push(fn)
    },
    uno,
    extract,
    getConfig,
    root,
    updateRoot,
    getConfigFileList: () => configFileList
  }
}

async function applyTransformers (ctx, original, id, enforce = 'default') {
  if (original.includes(IGNORE_COMMENT)) { return }
  const transformers = (ctx.uno.config.transformers || []).filter((i) => (i.enforce || 'default') === enforce)
  if (!transformers.length) { return }
  let code = original
  let s = new MagicString__default(code)
  const maps = []
  for (const t of transformers) {
    if (t.idFilter) {
      if (!t.idFilter(id)) { continue }
    } else if (!ctx.filter(code, id)) {
      continue
    }
    await t.transform(s, id, ctx)
    if (s.hasChanged()) {
      code = s.toString()
      maps.push(s.generateMap({ hires: true, source: id }))
      s = new MagicString__default(code)
    }
  }
  if (code !== original) {
    ctx.affectedModules.add(id)
    return {
      code,
      map: remapping__default(maps, () => null)
    }
  }
}

function getHash (input, length = 8) {
  return node_crypto.createHash('sha256').update(input).digest('hex').slice(0, length)
}

function normalizeAbsolutePath (path) {
  if (node_path.isAbsolute(path)) { return node_path.normalize(path) } else { return path }
}

function getPath (id) {
  return id.replace(/\?.*$/, '')
}
function isCssId (id) {
  return core.cssIdRE.test(id)
}
module.exports = {
  createContext,
  applyTransformers,
  getHash,
  getPath,
  isCssId,
  normalizeAbsolutePath
}
