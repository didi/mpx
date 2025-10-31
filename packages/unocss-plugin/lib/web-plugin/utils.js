import pluginutils from '@rollup/pluginutils'
import { loadConfig } from '@unocss/config'
import { cssIdRE as defCssIdRE, createGenerator } from '@unocss/core'
import node_path from 'node:path'
import MagicString from 'magic-string'
import remapping from '@ampproject/remapping'

const INCLUDE_COMMENT = '@unocss-include'
const IGNORE_COMMENT = '@unocss-ignore'
const CSS_PLACEHOLDER = '@unocss-placeholder'

const defaultExclude = [defCssIdRE]
const defaultInclude = [/\.(vue|mpx|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/]
const sfcIdRE = /\.(vue|mpx)($|\?)/
const templateIdRE = /\.(wxml|axml|swan|qml|ttml|qxml|jxml|ddml|html)($|\?)/
const cssIdRE = /\.(wxss|acss|css|qss|ttss|jxss|ddss)($|\?)/

async function createContext (configOrPath, defaults = {}, extraConfigSources = []) {
  const root = process.cwd()
  let rawConfig = {}
  const uno = await createGenerator(rawConfig, defaults)
  let rollupFilter = pluginutils.createFilter(defaultInclude, defaultExclude)
  const idFilter = pluginutils.createFilter([sfcIdRE, templateIdRE, cssIdRE, defCssIdRE])
  const ready = reloadConfig()

  async function reloadConfig () {
    const result = await loadConfig(root, configOrPath, extraConfigSources, defaults)
    rawConfig = result.config
    uno.setConfig(rawConfig)
    rollupFilter = pluginutils.createFilter(
      rawConfig.include || defaultInclude,
      rawConfig.exclude || defaultExclude
    )
    const presets = /* @__PURE__ */ new Set()
    uno.config.presets.forEach((i) => {
      if (!i.name) {
        return
      }
      if (presets.has(i.name)) {
        console.warn(`[unocss] duplication of preset ${i.name} found, there might be something wrong with your config.`)
      } else {
        presets.add(i.name)
      }
    })

    const transformers = uno.config.transformers
    if (transformers) {
      const pre = []
      const normal = []
      const post = []
      transformers.forEach(i => {
        if (i.enforce === 'pre') pre.push(i)
        else if (i.enforce === 'post') post.push(i)
        else normal.push(i)
      })
      uno.config.transformers = [
        ...pre,
        ...normal,
        ...post
      ]
    }

    return result
  }

  async function extract (code, id) {
    const tokens = new Set()
    await uno.applyExtractors(code, id, tokens)
    if (tokens.size > 0) {
      this.emitFile(id, '', undefined, {
        skipEmit: true,
        unocssTokens: tokens
      })
    }
  }

  function filter (code, id) {
    if (!idFilter(id)) {
      return false
    }
    if (code.includes(IGNORE_COMMENT)) {
      return false
    }
    return code.includes(INCLUDE_COMMENT) || code.includes(CSS_PLACEHOLDER) || rollupFilter(id.replace(/\?v=\w+$/, ''))
  }

  return {
    get ready () {
      return ready
    },
    filter,
    uno,
    extract,
    transformCache: new Map()
  }
}

async function applyTransformers (ctx, original, id) {
  if (original.includes(IGNORE_COMMENT)) {
    return
  }
  const transformers = ctx.uno.config.transformers
  if (!transformers.length) return
  let code = original
  const maps = []
  for (const t of transformers) {
    // transformerVariantGroup会调用s.overwrite影响transformerDirectives执行，所以每次重新赋值。
    const s = new MagicString(code)
    if (t.idFilter) {
      if (!t.idFilter(id)) {
        continue
      }
    } else if (!ctx.filter(code, id)) {
      continue
    }
    await t.transform(s, id, ctx)
    if (s.hasChanged()) {
      code = s.toString()
      maps.push(s.generateMap({ hires: true, source: id }))
    }
  }
  if (code !== original) {
    return {
      code,
      map: remapping(maps, () => null)
    }
  }
}

function normalizeAbsolutePath (path) {
  if (node_path.isAbsolute(path)) {
    return node_path.normalize(path)
  } else {
    return path
  }
}

function getPath (id) {
  return id.replace(/\?.*$/, '')
}

function isCssId (id) {
  return defCssIdRE.test(id) || cssIdRE.test(id)
}

export {
  createContext,
  applyTransformers,
  getPath,
  isCssId,
  normalizeAbsolutePath
}
