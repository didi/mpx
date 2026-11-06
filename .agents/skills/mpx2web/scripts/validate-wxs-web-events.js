#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

function validateFile (file, options = {}) {
  file = path.resolve(file)
  const webVariant = file.replace(/(?<!\.web)\.mpx$/i, '.web.mpx')
  if (!options.webFile && webVariant !== file && fs.existsSync(webVariant)) {
    return ['待验证：存在同名 Web 文件；请按项目解析规则确认实际入口，再用 --web-file=<实际文件> 检查，不能仅凭文件存在跳过。']
  }
  const selected = options.webFile ? path.resolve(options.webFile) : file
  try {
    const source = fs.readFileSync(selected, 'utf8')
    const compiler = require(require.resolve('@mpxjs/webpack-plugin/lib/template-compiler/compiler', {
      paths: [options.projectRoot || path.dirname(selected)]
    }))
    const blocks = compiler.parseComponent(source, { mode: 'web', env: options.env || '' })
    if (!blocks.template || blocks.template.src) {
      return ['待验证：缺少内联模板，请检查实际模板入口。']
    }
    const errors = []
    const parsed = compiler.parse(blocks.template.content, {
      mode: 'web',
      srcMode: options.srcMode || blocks.template.srcMode || 'wx',
      env: options.env || '',
      defs: Object.assign({}, options.defs, { __mpx_mode__: 'web' }),
      usingComponentsInfo: {},
      externalClasses: [],
      filePath: selected,
      warn: () => {},
      error: message => errors.push('待验证：Web 模板编译报错：' + message)
    })
    const modules = new Set(
      Object.keys(parsed.meta.wxsContentMap || {}).concat(Object.keys(parsed.meta.wxsModuleMap || {}))
    )
    if (parsed.meta.imports && parsed.meta.imports.length) {
      errors.push('待验证：模板包含外部 <import>，请同时检查实际导入模板：' + parsed.meta.imports.join(', '))
    }
    if (!modules.size) return errors

    // Inspect compiler-normalized events, including colon syntax and platform branches.
    function visit (node) {
      if (!node) return
      ;(node.attrsList || []).forEach(attr => {
        if (!/^@|^v-on:/.test(attr.name)) return
        modules.forEach(module => {
          const escaped = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          if (new RegExp('\\b' + escaped + '\\s*(?:\\.|\\[)').test(attr.value)) {
            errors.push(selected + ': Web 事件 ' + attr.name + ' 仍直接引用 WXS 模块 ' + module)
          }
        })
      })
      ;(node.children || []).forEach(visit)
      ;(node.ifConditions || []).forEach(condition => {
        if (condition.block !== node) visit(condition.block)
      })
    }
    visit(parsed.root)
    return Array.from(new Set(errors))
  } catch (error) {
    return ['待验证：无法检查实际 Web 模板：' + error.message]
  }
}

function main () {
  const options = {}
  const files = []
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--web-file=')) options.webFile = arg.slice(11)
    else if (arg.startsWith('--project-root=')) options.projectRoot = arg.slice(15)
    else if (arg.startsWith('--src-mode=')) options.srcMode = arg.slice(11)
    else if (arg.startsWith('--env=')) options.env = arg.slice(6)
    else files.push(arg)
  })
  if (!files.length || (options.webFile && files.length !== 1)) {
    console.error('usage: validate-wxs-web-events <file.mpx>... [--project-root=<project>] [--web-file=<confirmed-web-entry>] [--src-mode=<mode>] [--env=<env>]')
    process.exit(2)
  }
  let failed = false
  files.forEach(file => {
    const errors = validateFile(file, options)
    errors.forEach(error => console.error(error))
    failed = failed || errors.length > 0
  })
  console.error('检查范围：Web 模板直接 WXS 绑定；不证明方法可执行、两端行为等价或实际运行通过。未传入实际 src-mode/env 或使用自定义 defs 时，请结合项目构建核验。')
  process.exit(failed ? 1 : 0)
}

module.exports = validateFile
if (require.main === module) main()
