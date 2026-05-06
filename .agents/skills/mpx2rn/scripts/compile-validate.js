#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

class MpxCliNotFoundError extends Error {
  constructor (msg) { super(msg); this.name = 'MpxCliNotFoundError' }
}
class InvalidInputError extends Error {
  constructor (msg) { super(msg); this.name = 'InvalidInputError' }
}

function resolveProjectRoot (startPath) {
  let cur = fs.existsSync(startPath) && fs.statSync(startPath).isDirectory()
    ? startPath
    : path.dirname(startPath)
  cur = path.resolve(cur)
  const rootDir = path.parse(cur).root
  while (true) {
    const pkgPath = path.join(cur, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies)
        if (deps['@mpxjs/mpx-cli-service']) return cur
      } catch (_) { /* ignore parse error */ }
    }
    if (fs.existsSync(path.join(cur, 'node_modules', '@mpxjs', 'mpx-cli-service'))) {
      return cur
    }
    if (cur === rootDir) return null
    cur = path.dirname(cur)
  }
}

function requireFromProject (name, projectRoot) {
  const resolved = require.resolve(name, { paths: [projectRoot] })
  return require(resolved)
}

// 简单 semver 比较：a >= b 返回 true。仅支持 'x.y.z' 三段数字。
function gteVersion (a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da > db) return true
    if (da < db) return false
  }
  return true
}

// `partialCompileRules.components` 自 @mpxjs/webpack-plugin@2.10.20 起支持。
// 低版本回退到前置 loader 剥离 usingComponents 的"不完美"兼容方案。
const PARTIAL_COMPILE_COMPONENTS_MIN_VERSION = '2.10.20'

async function compileValidate (input, options = {}) {
  const mpxPaths = (Array.isArray(input) ? input : [input]).map(p => path.resolve(p))
  for (const p of mpxPaths) {
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
      throw new InvalidInputError(`输入不是有效文件: ${p}`)
    }
  }

  const {
    target = 'ios',
    type = 'component',
    projectRoot: explicitRoot,
    ignoreSubComponents = true,
    cleanup = true
  } = options

  if (type !== 'page' && type !== 'component') {
    throw new InvalidInputError(`不支持的 type: ${type}，只接受 'page' 或 'component'`)
  }

  const projectRoot = explicitRoot
    ? path.resolve(explicitRoot)
    : resolveProjectRoot(mpxPaths[0])
  if (!projectRoot) {
    throw new MpxCliNotFoundError(
      `当前环境未安装 mpx-cli (@mpxjs/mpx-cli-service)，无法执行真实编译校验。起点: ${mpxPaths[0]}`
    )
  }
  try {
    require.resolve('@mpxjs/mpx-cli-service', { paths: [projectRoot] })
  } catch (_) {
    throw new MpxCliNotFoundError(`项目 ${projectRoot} 中未安装 @mpxjs/mpx-cli-service`)
  }

  const targets = Array.isArray(target) ? target : [target]
  if (targets.length === 1) {
    return compileOne(projectRoot, mpxPaths, targets[0], type, ignoreSubComponents, cleanup)
  }
  const out = {}
  for (const t of targets) {
    out[t] = await compileOne(projectRoot, mpxPaths, t, type, ignoreSubComponents, cleanup)
  }
  return out
}

async function compileOne (projectRoot, mpxPaths, targetMode, type, ignoreSubComponents, cleanup) {
  const startedAt = Date.now()
  const originalCwd = process.cwd()

  const Service = requireFromProject('@mpxjs/mpx-cli-service', projectRoot)
  const sharedUtils = requireFromProject('@mpxjs/cli-shared-utils', projectRoot)
  const { setTargetProcessEnv, SUPPORT_MODE } = sharedUtils
  const { resolveBuildWebpackConfigByTarget } = requireFromProject(
    '@mpxjs/vue-cli-plugin-mpx/config', projectRoot
  )
  const { addBuildWebpackConfig } = requireFromProject(
    '@mpxjs/vue-cli-plugin-mpx/config/base', projectRoot
  )
  const filterPluginsByPlatform = requireFromProject(
    '@mpxjs/mpx-cli-service/utils/filterPlugins', projectRoot
  )
  const PluginAPI = requireFromProject('@vue/cli-service/lib/PluginAPI', projectRoot)
  const webpack = requireFromProject('webpack', projectRoot)
  const MpxWebpackPlugin = requireFromProject('@mpxjs/webpack-plugin', projectRoot)
  const mpxPluginPkg = requireFromProject('@mpxjs/webpack-plugin/package.json', projectRoot)
  const supportsComponentPartialCompile = gteVersion(
    mpxPluginPkg.version, PARTIAL_COMPILE_COMPONENTS_MIN_VERSION
  )

  if (!SUPPORT_MODE.includes(targetMode)) {
    throw new InvalidInputError(
      `不支持的 target: ${targetMode}，支持的列表: ${SUPPORT_MODE.join(', ')}`
    )
  }

  const target = { mode: targetMode }
  setTargetProcessEnv(target)
  process.env.NODE_ENV = 'production'
  process.env.BABEL_ENV = 'production'

  process.chdir(projectRoot)
  try {
    const service = new Service(projectRoot)
    const rawArgv = ['build', `--targets=${targetMode}`]
    const args = { _: ['build'], targets: targetMode, clean: false, watch: false }

    const origSetPluginsToSkip = service.setPluginsToSkip.bind(service)
    service.setPluginsToSkip = function (a) {
      origSetPluginsToSkip(a, rawArgv)
      let plugins = filterPluginsByPlatform(process.env.MPX_CLI_MODE)
      if (process.env.MPX_CLI_MODE !== 'web') {
        plugins = plugins.concat([
          'built-in:config/base',
          'built-in:config/app',
          'built-in:config/css'
        ])
      }
      plugins.forEach(p => this.pluginsToSkip.add(p))
    }
    service.setPluginsToSkip(args)
    await service.init('production')

    const api = new PluginAPI('compile-validate', service)
    const projectOptions = service.projectOptions

    const entryPaths = new Set(mpxPaths)
    const inTargetSet = (resourcePath) => entryPaths.has(path.resolve(resourcePath))

    api.chainWebpack((cfg) => {
      addBuildWebpackConfig(api, projectOptions, cfg, target, args)
      if (ignoreSubComponents && supportsComponentPartialCompile) {
        // 首选方案 (webpack-plugin >= 2.10.20)：通过 partialCompileRules 让 resolver
        // 把非目标 page/component 替换为内置占位实现，保留 usingComponents 声明、
        // 依赖解析仍正常进行，但不递归编译子组件内部。
        cfg.plugin('mpx-webpack-plugin').tap((pluginArgs) => {
          const opts = pluginArgs[0] = Object.assign({}, pluginArgs[0])
          if (type === 'page') {
            opts.partialCompileRules = {
              pages: { include: inTargetSet },
              components: { include: () => false }
            }
          } else {
            opts.partialCompileRules = {
              components: { include: inTargetSet }
            }
          }
          return pluginArgs
        })
      }
    })

    const webpackConfigs = await resolveBuildWebpackConfigByTarget(
      api, projectOptions, target, args
    )
    if (typeof api.runAfterResolveWebpackCallBack === 'function') {
      await api.runAfterResolveWebpackCallBack(webpackConfigs)
    }

    const outDir = path.join(
      os.tmpdir(),
      'mpx-compile-validate',
      crypto.createHash('md5')
        .update(mpxPaths.join('|') + '|' + targetMode + '|' + process.pid)
        .digest('hex')
    )
    fs.mkdirSync(outDir, { recursive: true })

    // 仅当宿主 webpack-plugin 不支持组件级 partialCompileRules 时启用前置 loader
    const useLegacyStripLoader = ignoreSubComponents && !supportsComponentPartialCompile
    const preLoaderPath = useLegacyStripLoader
      ? path.resolve(__dirname, 'strip-using-components-loader.js')
      : null

    rewriteWebpackConfigs(webpackConfigs, {
      mpxPaths, outDir, type, useLegacyStripLoader, preLoaderPath, entryPaths, MpxWebpackPlugin
    })

    const errors = []
    const warnings = []

    await new Promise((resolve, reject) => {
      webpack(webpackConfigs, (err, stats) => {
        if (err) { reject(err); return }
        const statsArr = stats && stats.stats
          ? stats.stats
          : stats
            ? [stats]
            : []
        for (const s of statsArr) {
          const info = s.toJson({
            all: false,
            errors: true,
            warnings: true,
            moduleTrace: true,
            errorDetails: false
          })
          ;(info.errors || []).forEach(e => errors.push(normalizeIssue(e)))
          ;(info.warnings || []).forEach(w => warnings.push(normalizeIssue(w)))
        }
        resolve()
      })
    })

    if (cleanup) {
      try { fs.rmSync(outDir, { recursive: true, force: true }) } catch (_) { /* ignore */ }
    }

    const summary = { total: errors.length, byCategory: {} }
    errors.forEach(e => {
      summary.byCategory[e.category] = (summary.byCategory[e.category] || 0) + 1
    })

    return {
      success: errors.length === 0,
      target: targetMode,
      projectRoot,
      errors,
      warnings,
      summary,
      durationMs: Date.now() - startedAt
    }
  } finally {
    process.chdir(originalCwd)
  }
}

function rewriteWebpackConfigs (webpackConfigs, ctx) {
  const { mpxPaths, outDir, type, useLegacyStripLoader, preLoaderPath, entryPaths, MpxWebpackPlugin } = ctx
  const makeEntry = type === 'page'
    ? MpxWebpackPlugin.getPageEntry.bind(MpxWebpackPlugin)
    : MpxWebpackPlugin.getComponentEntry.bind(MpxWebpackPlugin)
  const stripPluginNames = new Set([
    'BundleAnalyzerPlugin',
    'ESLintWebpackPlugin',
    'ESLintPlugin',
    'HtmlWebpackPlugin',
    'CopyPlugin',
    'CopyWebpackPlugin',
    'WebpackBar',
    'FriendlyErrorsWebpackPlugin',
    'CaseSensitivePathsPlugin',
    'PreloadPlugin'
  ])

  for (const cfg of webpackConfigs) {
    const entry = {}
    mpxPaths.forEach((p, i) => {
      entry[`__validate_${i}`] = makeEntry(p)
    })
    cfg.entry = entry

    cfg.output = Object.assign({}, cfg.output, { path: outDir, clean: false })

    cfg.devtool = 'source-map'
    cfg.cache = false
    cfg.performance = false
    cfg.bail = false
    cfg.stats = 'errors-warnings'
    cfg.optimization = Object.assign({}, cfg.optimization, {
      minimize: false,
      splitChunks: false,
      runtimeChunk: false
    })

    if (Array.isArray(cfg.plugins)) {
      cfg.plugins = cfg.plugins.filter(p => {
        const n = p && p.constructor && p.constructor.name
        return !stripPluginNames.has(n)
      })
    }

    if (useLegacyStripLoader) {
      cfg.module = cfg.module || {}
      cfg.module.rules = cfg.module.rules || []
      cfg.module.rules.unshift({
        enforce: 'pre',
        test (resource) {
          return entryPaths.has(path.resolve(resource))
        },
        resourceQuery (query) {
          return !query || !/[?&]type=/.test(query)
        },
        use: [preLoaderPath]
      })
    }
  }
}

function normalizeIssue (raw) {
  const obj = typeof raw === 'string' ? { message: raw } : (raw || {})
  const msg = obj.message || String(raw)
  const moduleIdent = obj.moduleIdentifier || obj.moduleName || ''
  const mpxDiagnostic = parseMpxDiagnosticHeader(msg)
  const file = mpxDiagnostic.file || extractFile(moduleIdent) || obj.file
  const loc = parseLoc(obj.loc) || mpxDiagnostic.loc
  const blockType = detectBlock(moduleIdent)
  const category = categorize({ message: msg, moduleIdent, blockType, name: obj.name })
  return {
    category,
    message: truncate(msg, 20),
    file,
    block: blockType,
    loc,
    raw: msg
  }
}

function truncate (msg, maxLines) {
  const lines = String(msg).split('\n')
  if (lines.length <= maxLines) return msg
  return lines.slice(0, maxLines).join('\n') + '\n...'
}

function parseMpxDiagnosticHeader (msg) {
  const match = String(msg).match(/^\[Mpx [^\]]+\]\[([^\]]+)\]:/)
  if (!match) return {}
  return parseFileLoc(match[1])
}

function parseFileLoc (raw) {
  const match = String(raw).match(/^(.*):(\d+):(\d+)$/)
  if (match) {
    return {
      file: match[1],
      loc: {
        line: +match[2],
        column: +match[3]
      }
    }
  }
  return {
    file: raw
  }
}

function extractFile (moduleIdent) {
  if (!moduleIdent) return undefined
  const m = moduleIdent.match(/([^!?\s]+\.mpx)(?:[?!]|$)/)
  if (m) return m[1]
  const segs = moduleIdent.split('!').filter(Boolean)
  const last = segs[segs.length - 1] || moduleIdent
  return last.split('?')[0]
}

function parseLoc (loc) {
  if (!loc) return undefined
  if (typeof loc === 'object' && loc.start) {
    return { line: loc.start.line, column: loc.start.column }
  }
  if (typeof loc === 'string') {
    const m = loc.match(/(\d+):(\d+)/)
    if (m) return { line: +m[1], column: +m[2] }
  }
  return undefined
}

function detectBlock (moduleIdent) {
  if (!moduleIdent) return undefined
  const q = moduleIdent.split('?')[1] || ''
  if (/[?&]type=styles?/.test('?' + q)) return 'style'
  if (/[?&]type=template/.test('?' + q)) return 'template'
  if (/[?&]type=script/.test('?' + q)) return 'script'
  if (/[?&]type=json/.test('?' + q)) return 'json'
  return undefined
}

function categorize ({ message, moduleIdent, blockType, name }) {
  const msg = String(message || '')
  const hay = `${moduleIdent || ''}\n${msg}`.toLowerCase()
  if (name === 'ModuleNotFoundError' || /can't resolve|module not found/.test(hay)) {
    return 'dependency'
  }
  if (/\[mpx style (error|warn)/i.test(msg)) return 'style'
  if (/\[mpx template (error|warn)/i.test(msg)) return 'template'
  if (/\[mpx json (error|warn)/i.test(msg)) return 'json'
  if (/\[mpx script (error|warn)/i.test(msg)) return 'script'
  if (blockType === 'style' || /style-compiler|postcss-loader|wxss-loader/.test(hay)) return 'style'
  if (blockType === 'template' || /template-compiler/.test(hay)) return 'template'
  if (blockType === 'json' || /json-compiler/.test(hay)) return 'json'
  if (blockType === 'script' || /script-compiler|babel-loader|ts-loader/.test(hay)) return 'script'
  return 'other'
}

module.exports = compileValidate
module.exports.compileValidate = compileValidate
module.exports.resolveProjectRoot = resolveProjectRoot
module.exports.categorize = categorize
module.exports.MpxCliNotFoundError = MpxCliNotFoundError
module.exports.InvalidInputError = InvalidInputError

if (require.main === module) {
  runCli().catch(err => {
    console.error(err && err.stack ? err.stack : err)
    process.exit(2)
  })
}

async function runCli () {
  const argv = process.argv.slice(2)
  const files = []
  let targetArg = 'ios'
  let typeArg = 'component'
  let jsonOut = false
  let ignoreSubComponents = true
  let projectRoot

  for (const a of argv) {
    if (a === '-h' || a === '--help') { printHelp(); process.exit(0) }
    else if (a.startsWith('--target=')) targetArg = a.slice('--target='.length)
    else if (a.startsWith('--type=')) typeArg = a.slice('--type='.length)
    else if (a.startsWith('--project-root=')) projectRoot = a.slice('--project-root='.length)
    else if (a === '--json') jsonOut = true
    else if (a === '--no-ignore-sub-components') ignoreSubComponents = false
    else if (a.startsWith('-')) {
      console.error(`未知参数: ${a}`); process.exit(2)
    } else {
      files.push(a)
    }
  }
  if (!files.length) { printHelp(); process.exit(2) }

  const target = targetArg.includes(',') ? targetArg.split(',') : targetArg
  const result = await compileValidate(files, {
    target, type: typeArg, ignoreSubComponents, projectRoot
  })

  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    prettyPrint(result)
  }
  process.exit(isSuccess(result) ? 0 : 1)
}

function printHelp () {
  console.log(`usage: compile-validate <file.mpx>... [options]

options:
  --target=<mode>              编译目标 (默认 ios)，多个用逗号分隔
  --type=<page|component>      入口类型，默认 component
  --project-root=<path>        显式指定宿主项目根目录（覆盖自动探测）
  --no-ignore-sub-components   不忽略子组件，一并纳入编译
  --json                       输出结构化 JSON
  -h, --help                   查看帮助`)
}

function isSuccess (result) {
  if (!result) return true
  if (typeof result.success === 'boolean') return result.success
  return Object.values(result).every(r => r && r.success)
}

function prettyPrint (result) {
  if (result && typeof result.success === 'boolean') { prettyPrintOne(result); return }
  for (const [t, r] of Object.entries(result)) {
    console.log(`\n=== target=${t} ===`)
    prettyPrintOne(r)
  }
}

function prettyPrintOne (r) {
  console.log(`target: ${r.target}  success: ${r.success}  duration: ${r.durationMs}ms`)
  console.log(`errors: ${r.errors.length}  warnings: ${r.warnings.length}`)
  if (r.summary.total > 0) {
    const pairs = Object.entries(r.summary.byCategory)
      .map(([k, v]) => `${k}=${v}`).join(', ')
    console.log(`by category: ${pairs}`)
  }
  r.errors.forEach((e, i) => {
    const locStr = e.loc ? `:${e.loc.line}:${e.loc.column}` : ''
    const fileStr = e.file ? ` ${e.file}${locStr}` : ''
    console.log(`\n[${i + 1}][${e.category}${e.block ? '/' + e.block : ''}]${fileStr}`)
    console.log(e.message)
  })
}
