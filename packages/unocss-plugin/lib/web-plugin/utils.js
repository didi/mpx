const pluginutils = require('@rollup/pluginutils')
const config = require('@unocss/config')
const core = require('@unocss/core')
const node_path = require('node:path')
const MagicString = require('magic-string')
const remapping = require('@ampproject/remapping')

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e }

const MagicString__default = /* #__PURE__ */_interopDefaultLegacy(MagicString)
const remapping__default = /* #__PURE__ */_interopDefaultLegacy(remapping)

const INCLUDE_COMMENT = '@unocss-include'
const IGNORE_COMMENT = '@unocss-ignore'
const CSS_PLACEHOLDER = '@unocss-placeholder'

const defaultExclude = [core.cssIdRE]
const defaultInclude = [/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/]

function createContext (configOrPath, defaults = {}, extraConfigSources = []) {
  const root = process.cwd()
  let rawConfig = {}
  const uno = core.createGenerator(rawConfig, defaults)
  let rollupFilter = pluginutils.createFilter(defaultInclude, defaultExclude)
  const ready = reloadConfig()
  async function reloadConfig () {
    const result = await config.loadConfig(root, configOrPath, extraConfigSources, defaults)
    rawConfig = result.config
    uno.setConfig(rawConfig)
    rollupFilter = pluginutils.createFilter(
      rawConfig.include || defaultInclude,
      rawConfig.exclude || defaultExclude
    )
    const presets = /* @__PURE__ */ new Set()
    uno.config.presets.forEach((i) => {
      if (!i.name) { return }
      if (presets.has(i.name)) { console.warn(`[unocss] duplication of preset ${i.name} found, there might be something wrong with your config.`) } else { presets.add(i.name) }
    })
    return result
  }
  async function extract (code, id) {
    const tokens = new Set()
    const len = tokens.size
    await uno.applyExtractors(code, id, tokens)
    if (tokens.size > len) {
      this.emitFile(id, '', undefined, {
        skipEmit: true,
        unocssTokens: new Set(tokens)
      })
    }
  }
  function filter (code, id) {
    if (code.includes(IGNORE_COMMENT)) { return false }
    return code.includes(INCLUDE_COMMENT) || code.includes(CSS_PLACEHOLDER) || rollupFilter(id.replace(/\?v=\w+$/, ''))
  }

  return {
    get ready () {
      return ready
    },
    filter,
    uno,
    extract
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
    return {
      code,
      map: remapping__default(maps, () => null)
    }
  }
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
  getPath,
  isCssId,
  normalizeAbsolutePath
}
