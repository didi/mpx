#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const VALID_MODES = new Set([
  'wx',
  'ali',
  'swan',
  'qq',
  'tt',
  'jd',
  'dd',
  'qa',
  'ks',
  'web',
  'ios',
  'android',
  'harmony'
])

const MINI_TARGET_MODES = new Set([
  'ali',
  'swan',
  'qq',
  'tt',
  'jd',
  'dd',
  'qa',
  'ks'
])

const TEMPLATE_EXTENSIONS = new Set([
  '.mpx',
  '.vue',
  '.wxml',
  '.axml',
  '.swan',
  '.ttml',
  '.qml',
  '.jxml',
  '.ddml',
  '.ksml',
  '.html'
])

const CONFIG_EXTENSIONS = new Set([
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.cts',
  '.mts'
])

const SCANNABLE_EXTENSIONS = new Set([
  ...TEMPLATE_EXTENSIONS,
  ...CONFIG_EXTENSIONS,
  '.json',
  '.json5'
])

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.svn',
  '.hg',
  '.idea',
  '.vscode',
  '.cache',
  '.turbo',
  '.next',
  '.output',
  '.agents',
  '.claude',
  '.codex',
  'node_modules',
  'miniprogram_npm',
  'dist',
  'build',
  'coverage',
  'unpackage'
])

const MAX_FILE_SIZE = 2 * 1024 * 1024

function parseArgs (argv) {
  const options = {
    root: process.cwd(),
    json: false
  }
  let rootSet = false

  argv.forEach((arg) => {
    if (arg === '--json' || arg === '--format=json') {
      options.json = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (!rootSet) {
      options.root = arg
      rootSet = true
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  })

  options.root = path.resolve(options.root)
  return options
}

function printHelp () {
  process.stdout.write(`Usage: node scan-project.js [project-root] [--json]

Scans an Mpx project for migration candidates introduced by the mode/srcMode
semantic split. The command is read-only and exits non-zero only on scan errors.
`)
}

function toPosix (value) {
  return value.split(path.sep).join('/')
}

function isIgnoredDirectory (name) {
  return IGNORED_DIRECTORIES.has(name)
}

function collectFiles (root, state, current) {
  current = current || root
  const entries = fs.readdirSync(current, { withFileTypes: true })

  entries.forEach((entry) => {
    const absolutePath = path.join(current, entry.name)
    if (entry.isSymbolicLink()) {
      state.skippedFiles++
      return
    }
    if (entry.isDirectory()) {
      if (!isIgnoredDirectory(entry.name)) collectFiles(root, state, absolutePath)
      return
    }
    if (!entry.isFile()) return

    const extension = path.extname(entry.name).toLowerCase()
    if (!SCANNABLE_EXTENSIONS.has(extension)) return

    const stat = fs.statSync(absolutePath)
    if (stat.size > MAX_FILE_SIZE) {
      state.skippedFiles++
      return
    }
    state.files.push(absolutePath)
  })
}

function readTextFile (file, state) {
  const buffer = fs.readFileSync(file)
  if (buffer.includes(0)) {
    state.skippedFiles++
    return null
  }
  state.scannedFiles++
  return buffer.toString('utf8')
}

function getLineInfo (content, index) {
  const before = content.slice(0, index)
  const line = before.split(/\r?\n/).length
  const lineStart = before.lastIndexOf('\n') + 1
  const lineEndRaw = content.indexOf('\n', index)
  const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw
  return {
    line,
    column: index - lineStart + 1,
    snippet: content.slice(lineStart, lineEnd).trim().slice(0, 240)
  }
}

function addFinding (state, finding) {
  const lineInfo = getLineInfo(finding.content, finding.index)
  state.findings.push({
    code: finding.code,
    disposition: finding.disposition,
    severity: finding.severity,
    file: finding.file,
    line: lineInfo.line,
    column: lineInfo.column,
    message: finding.message,
    suggestion: finding.suggestion,
    evidence: lineInfo.snippet
  })
}

function isCommentLine (content, index) {
  const info = getLineInfo(content, index)
  return /^(?:\/\/|\/\*|\*|#)/.test(info.snippet)
}

function scanConfigRules (relativePath, content, state) {
  if (!CONFIG_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) return

  const occurrences = {
    modeRules: [],
    srcModeRules: []
  }
  const rulePattern = /(?:["']?)(modeRules|srcModeRules)(?:["']?)\s*:/g
  let match

  while ((match = rulePattern.exec(content))) {
    if (isCommentLine(content, match.index)) continue
    occurrences[match[1]].push(match.index)
  }

  occurrences.modeRules.forEach((index) => {
    addFinding(state, {
      code: 'LEGACY_MODE_RULES',
      disposition: 'compatible-cleanup',
      severity: 'low',
      file: relativePath,
      content,
      index,
      message: '发现旧 modeRules 配置；新版仍兼容，但名称不再准确。',
      suggestion: '确认没有同时配置 srcModeRules 后，将该 key 改为 srcModeRules。'
    })
  })

  if (occurrences.modeRules.length && occurrences.srcModeRules.length) {
    addFinding(state, {
      code: 'CONFIG_RULES_CONFLICT_CANDIDATE',
      disposition: 'action-required',
      severity: 'high',
      file: relativePath,
      content,
      index: Math.min(occurrences.modeRules[0], occurrences.srcModeRules[0]),
      message: '同一文件同时出现 modeRules 和 srcModeRules，若它们进入同一插件实例会触发配置冲突。',
      suggestion: '核实最终配置对象；若属于同一实例，合并到 srcModeRules 并删除 modeRules。'
    })
  }
}

function getConditionalFileMode (relativePath) {
  const parts = path.basename(relativePath).split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    if (MINI_TARGET_MODES.has(parts[i])) return parts[i]
  }
}

function scanConditionalFile (relativePath, content, state) {
  const mode = getConditionalFileMode(relativePath)
  if (!mode) return

  addFinding(state, {
    code: 'CONDITIONAL_FILE_SOURCE_MODE',
    disposition: 'needs-review',
    severity: 'medium',
    file: relativePath,
    content,
    index: 0,
    message: `条件文件命中 ${mode}；新版不再把文件名隐式解释为 ${mode} 源码方言。`,
    suggestion: `若文件按项目 srcMode 编写则无需修改；若完整使用 ${mode} 原生语法，用 srcModeRules.${mode} 精确覆盖。`
  })

  if (isStandaloneTemplate(relativePath)) {
    scanExternalTemplateLinks(relativePath, content, 0, mode, state)
  }
}

function getAttributeValue (attrs, name) {
  const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i')
  const match = pattern.exec(attrs)
  return match && match[2]
}

function findMatchingTemplateClose (content, start) {
  const tokenPattern = /<\/?template\b[^>]*>/gi
  tokenPattern.lastIndex = start
  let depth = 0
  let match

  while ((match = tokenPattern.exec(content))) {
    const token = match[0]
    if (/^<\//.test(token)) {
      depth--
      if (depth === 0) {
        return {
          closeStart: match.index,
          end: tokenPattern.lastIndex
        }
      }
    } else if (!/\/>$/.test(token)) {
      depth++
    }
  }
}

function findSfcBlocks (content) {
  const blocks = []
  const openPattern = /<(template|script|style)\b([^>]*)>/gi
  let cursor = 0

  while (cursor < content.length) {
    openPattern.lastIndex = cursor
    const match = openPattern.exec(content)
    if (!match) break

    const tag = match[1].toLowerCase()
    const openEnd = openPattern.lastIndex
    let close

    if (/\/>$/.test(match[0])) {
      close = {
        closeStart: openEnd,
        end: openEnd
      }
    } else if (tag === 'template') {
      close = findMatchingTemplateClose(content, match.index)
    } else {
      const closePattern = new RegExp(`</${tag}\\s*>`, 'ig')
      closePattern.lastIndex = openEnd
      const closeMatch = closePattern.exec(content)
      if (closeMatch) {
        close = {
          closeStart: closeMatch.index,
          end: closePattern.lastIndex
        }
      }
    }

    if (!close) break
    blocks.push({
      tag,
      attrs: match[2],
      start: match.index,
      openEnd,
      closeStart: close.closeStart,
      end: close.end,
      content: content.slice(openEnd, close.closeStart)
    })
    cursor = close.end
  }

  return blocks
}

function getBlockType (block) {
  if (block.tag !== 'script') return block.tag
  const name = getAttributeValue(block.attrs, 'name')
  const type = getAttributeValue(block.attrs, 'type')
  return name === 'json' || (type && /^application\/json/.test(type)) ? 'json' : 'script'
}

function isBlockModeAffected (blockType, mode) {
  if (!mode || mode === 'wx') return false
  if (blockType === 'template' || blockType === 'script') return VALID_MODES.has(mode)
  if (blockType === 'json') return MINI_TARGET_MODES.has(mode)
  return false
}

function scanSfcBlocks (relativePath, content, state) {
  const blocks = findSfcBlocks(content)
  const resourceMode = getConditionalFileMode(relativePath)

  blocks.forEach((block) => {
    const mode = getAttributeValue(block.attrs, 'mode')
    const srcMode = getAttributeValue(block.attrs, 'src-mode')
    const blockType = getBlockType(block)

    if (isBlockModeAffected(blockType, mode) && !srcMode) {
      addFinding(state, {
        code: 'SFC_BLOCK_SOURCE_MODE',
        disposition: 'needs-review',
        severity: 'medium',
        file: relativePath,
        content,
        index: block.start,
        message: `${blockType} 区块的 mode="${mode}" 新版只负责筛选，不再隐式设置局部源码方言。`,
        suggestion: `若区块按项目 srcMode 编写则无需修改；若完整使用 ${mode} 原生语法，增加 src-mode="${mode}"。`
      })
    }

    if (blockType === 'template') {
      scanConditionalAttributes(relativePath, block.content, block.openEnd, state)
      const effectiveMode = mode || resourceMode
      if (MINI_TARGET_MODES.has(effectiveMode) && (!srcMode || srcMode === effectiveMode)) {
        scanExternalTemplateLinks(relativePath, block.content, block.openEnd, effectiveMode, state)
      }
    }
  })
}

function parseTagAttributes (tagText, tagOffset) {
  const attributes = []
  let index = 1

  while (index < tagText.length && !/\s/.test(tagText[index]) && tagText[index] !== '>') index++

  while (index < tagText.length) {
    while (/\s/.test(tagText[index])) index++
    if (index >= tagText.length || tagText[index] === '>' || tagText[index] === '/') break

    const nameStart = index
    while (index < tagText.length && !/[\s=/>]/.test(tagText[index])) index++
    const name = tagText.slice(nameStart, index)
    while (/\s/.test(tagText[index])) index++

    if (tagText[index] === '=') {
      index++
      while (/\s/.test(tagText[index])) index++
      const quote = tagText[index]
      if (quote === '"' || quote === "'") {
        index++
        while (index < tagText.length && tagText[index] !== quote) index++
        if (tagText[index] === quote) index++
      } else {
        while (index < tagText.length && !/[\s>]/.test(tagText[index])) index++
      }
    }

    if (name) {
      attributes.push({
        name,
        index: tagOffset + nameStart
      })
    }
  }

  return attributes
}

function getConditionalModeInfo (attributeName) {
  const atIndex = attributeName.lastIndexOf('@')
  if (atIndex === -1) return

  const baseName = attributeName.slice(0, atIndex)
  let condition = attributeName.slice(atIndex + 1)
  if (!condition) return
  if (condition.startsWith('(') && condition.endsWith(')')) {
    condition = condition.slice(1, -1)
  }

  const branches = condition.split('|').map((item) => {
    const modeRaw = item.split(':')[0]
    const implicit = modeRaw.startsWith('_')
    const mode = implicit ? modeRaw.slice(1) : modeRaw
    return {
      mode,
      implicit
    }
  }).filter((item) => VALID_MODES.has(item.mode))

  if (!branches.length) return
  return {
    baseName,
    branches
  }
}

function scanConditionalAttributes (relativePath, templateContent, baseOffset, state) {
  const tagPattern = /<[A-Za-z][^<>]*>/g
  let tagMatch

  while ((tagMatch = tagPattern.exec(templateContent))) {
    const attributes = parseTagAttributes(tagMatch[0], baseOffset + tagMatch.index)
    attributes.forEach((attribute) => {
      const info = getConditionalModeInfo(attribute.name)
      if (!info || info.baseName === 'mpxTagName') return

      const changedModes = info.branches
        .filter((item) => !item.implicit && item.mode !== 'wx')
        .map((item) => item.mode)
      const compatibleModes = info.branches
        .filter((item) => item.implicit)
        .map((item) => item.mode)

      if (changedModes.length) {
        addFinding(state, {
          code: 'AT_MODE_TRANSFORM_SEMANTICS',
          disposition: 'needs-review',
          severity: 'medium',
          file: relativePath,
          content: state.contentByFile.get(relativePath),
          index: attribute.index,
          message: `${attribute.name} 在 ${[...new Set(changedModes)].join('|')} 命中后将进入正常平台转换，需确认是否按目标平台原生语法撰写。`,
          suggestion: '运行本 Skill 的 scripts/resolve-platform.js <project-root> 定位实际安装的 @mpxjs/webpack-plugin/lib/platform，核对 type + srcMode 规则集中是否同时命中 test 和目标 mode 处理器；未命中可安全直通且无需修改。'
        })
      } else if (compatibleModes.length) {
        addFinding(state, {
          code: 'COMPAT_UNDERSCORE_MODE',
          disposition: 'compatible-cleanup',
          severity: 'low',
          file: relativePath,
          content: state.contentByFile.get(relativePath),
          index: attribute.index,
          message: `${attribute.name} 仍兼容；@_mode 与新版 @mode 行为一致。`,
          suggestion: '无需阻塞升级；后续可去掉 mode 前的下划线，统一使用 @mode。'
        })
      }
    })
  }
}

function scanExternalTemplateLinks (relativePath, templateContent, baseOffset, mode, state) {
  const linkPattern = /<(import|include)\b[^>]*\bsrc\s*=\s*(["'])(.*?)\2[^>]*>/gi
  let match

  while ((match = linkPattern.exec(templateContent))) {
    addFinding(state, {
      code: 'EXTERNAL_TEMPLATE_SOURCE_MODE',
      disposition: 'needs-review',
      severity: 'medium',
      file: relativePath,
      content: state.contentByFile.get(relativePath),
      index: baseOffset + match.index,
      message: `${match[1]} 引用 ${match[3]} 不再继承引用方的 ${mode} 源码方言。`,
      suggestion: `解析被引用资源；若其使用 ${mode} 原生模板语法，用 srcModeRules.${mode} 覆盖该资源自身。`
    })
  }
}

function isStandaloneTemplate (relativePath) {
  const extension = path.extname(relativePath).toLowerCase()
  return TEMPLATE_EXTENSIONS.has(extension) && extension !== '.mpx' && extension !== '.vue'
}

function scanStandaloneTemplate (relativePath, content, state) {
  if (!isStandaloneTemplate(relativePath)) return
  scanConditionalAttributes(relativePath, content, 0, state)
}

function readPackageVersion (root) {
  const packagePath = path.join(root, 'package.json')
  if (!fs.existsSync(packagePath)) return
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const dependencies = Object.assign({}, pkg.dependencies, pkg.devDependencies)
    return dependencies['@mpxjs/webpack-plugin']
  } catch (e) {
    return null
  }
}

function summarize (findings) {
  return findings.reduce((result, finding) => {
    result[finding.disposition] = (result[finding.disposition] || 0) + 1
    return result
  }, {
    'action-required': 0,
    'needs-review': 0,
    'compatible-cleanup': 0
  })
}

function scanProject (root) {
  if (!fs.existsSync(root)) throw new Error(`Project root does not exist: ${root}`)
  if (!fs.statSync(root).isDirectory()) throw new Error(`Project root is not a directory: ${root}`)

  const state = {
    files: [],
    findings: [],
    scannedFiles: 0,
    skippedFiles: 0,
    contentByFile: new Map()
  }
  collectFiles(root, state)

  state.files.forEach((file) => {
    const relativePath = toPosix(path.relative(root, file))
    const content = readTextFile(file, state)
    if (content == null) return
    state.contentByFile.set(relativePath, content)

    scanConfigRules(relativePath, content, state)
    scanConditionalFile(relativePath, content, state)

    const extension = path.extname(relativePath).toLowerCase()
    if (extension === '.mpx' || extension === '.vue') {
      scanSfcBlocks(relativePath, content, state)
    } else {
      scanStandaloneTemplate(relativePath, content, state)
    }
  })

  state.findings.sort((a, b) => {
    return a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)
  })

  return {
    projectRoot: root,
    webpackPluginVersion: readPackageVersion(root) || null,
    summary: summarize(state.findings),
    stats: {
      filesScanned: state.scannedFiles,
      filesSkipped: state.skippedFiles
    },
    findings: state.findings
  }
}

function formatTextReport (report) {
  const lines = [
    '# Mpx mode/srcMode migration scan',
    '',
    `Project: ${report.projectRoot}`,
    `@mpxjs/webpack-plugin: ${report.webpackPluginVersion || 'not detected'}`,
    `Files scanned: ${report.stats.filesScanned}`,
    '',
    'Summary:',
    `- action-required: ${report.summary['action-required']}`,
    `- needs-review: ${report.summary['needs-review']}`,
    `- compatible-cleanup: ${report.summary['compatible-cleanup']}`
  ]

  if (!report.findings.length) {
    lines.push('', 'No migration candidates found.')
    return lines.join('\n') + '\n'
  }

  report.findings.forEach((finding) => {
    lines.push(
      '',
      `[${finding.disposition}] ${finding.code}`,
      `${finding.file}:${finding.line}:${finding.column}`,
      finding.message,
      `Evidence: ${finding.evidence || '(empty line)'}`,
      `Suggestion: ${finding.suggestion}`
    )
  })

  return lines.join('\n') + '\n'
}

function main () {
  try {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
      printHelp()
    } else {
      const report = scanProject(options.root)
      process.stdout.write(options.json ? JSON.stringify(report, null, 2) + '\n' : formatTextReport(report))
    }
  } catch (e) {
    process.stderr.write(`scan-project: ${e.message}\n`)
    process.exitCode = 1
  }
}

if (require.main === module) main()

module.exports = {
  scanProject,
  formatTextReport,
  findSfcBlocks,
  getConditionalModeInfo
}
