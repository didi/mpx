#!/usr/bin/env node

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { scanProject } = require('./scan-project')
const { resolvePlatformDirectory } = require('./resolve-platform')

function writeFixture (root, relativePath, content) {
  const file = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function getFindings (report, code) {
  return report.findings.filter((finding) => finding.code === code)
}

function run () {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-mode-srcmode-migration-'))

  try {
    writeFixture(root, 'package.json', JSON.stringify({
      devDependencies: {
        '@mpxjs/webpack-plugin': '^2.11.0'
      }
    }))
    writeFixture(root, 'node_modules/@mpxjs/webpack-plugin/package.json', JSON.stringify({
      name: '@mpxjs/webpack-plugin',
      version: '2.11.0',
      main: 'lib/index.js'
    }))
    writeFixture(root, 'node_modules/@mpxjs/webpack-plugin/lib/index.js', 'module.exports = function () {}\n')
    writeFixture(root, 'node_modules/@mpxjs/webpack-plugin/lib/platform/index.js', 'module.exports = function () {}\n')
    writeFixture(root, 'config/mpxPlugin.conf.js', `
module.exports = {
  modeRules: { ali: { include: /native/ } },
  srcModeRules: { ali: { include: /native/ } }
}
`)
    writeFixture(root, 'src/map.ali.mpx', `
<template>
  <import src="./parts/item.axml" />
  <view onTap="handleTap" />
</template>
`)
    writeFixture(root, 'src/card.ios.mpx', `
<template><View /></template>
`)
    writeFixture(root, 'src/page.mpx', `
<template mode="ali">
  <import src="./parts/footer.axml" />
  <view bindtap@ali="tap" class@_ali="legacy" mpxTagName@swan="cover-view" @:didi />
</template>
<script mode="ios">Component({})</script>
<style mode="ali">.box { color: red; }</style>
<script name="json" mode="ali">module.exports = {}</script>
`)
    writeFixture(root, 'src/native-block.mpx', `
<template mode="ali" src-mode="ali">
  <view onTap="tap" />
</template>
`)
    writeFixture(root, 'src/attributes.mpx', `
<template>
  <text numberOfLines@ios="{{1}}" />
  <view @wx />
</template>
`)

    const report = scanProject(root)
    assert.strictEqual(report.webpackPluginVersion, '^2.11.0')
    assert.strictEqual(getFindings(report, 'LEGACY_MODE_RULES').length, 1)
    assert.strictEqual(getFindings(report, 'CONFIG_RULES_CONFLICT_CANDIDATE').length, 1)

    const conditionalFiles = getFindings(report, 'CONDITIONAL_FILE_SOURCE_MODE')
    assert.strictEqual(conditionalFiles.length, 1)
    assert.strictEqual(conditionalFiles[0].file, 'src/map.ali.mpx')

    const blocks = getFindings(report, 'SFC_BLOCK_SOURCE_MODE')
    assert.deepStrictEqual(blocks.map((finding) => finding.line), [2, 6, 8])
    assert.strictEqual(blocks.some((finding) => finding.evidence.includes('<style')), false)
    assert.strictEqual(blocks.some((finding) => finding.file === 'src/native-block.mpx'), false)

    const atMode = getFindings(report, 'AT_MODE_TRANSFORM_SEMANTICS')
    assert.strictEqual(atMode.length, 2)
    assert.strictEqual(atMode.some((finding) => finding.message.startsWith('bindtap@ali ')), true)
    assert.strictEqual(atMode.some((finding) => finding.message.startsWith('numberOfLines@ios ')), true)
    assert.strictEqual(atMode.some((finding) => finding.message.startsWith('mpxTagName')), false)
    assert.strictEqual(atMode.some((finding) => finding.message.startsWith('@wx ')), false)
    assert.strictEqual(atMode.every((finding) => finding.message.includes('需确认是否按目标平台原生语法撰写')), true)
    assert.strictEqual(atMode.every((finding) => finding.suggestion.includes('scripts/resolve-platform.js <project-root>')), true)
    assert.strictEqual(atMode.every((finding) => finding.suggestion.includes('同时命中 test 和目标 mode 处理器')), true)
    assert.strictEqual(atMode.every((finding) => finding.suggestion.includes('可安全直通且无需修改')), true)

    const platformInfo = resolvePlatformDirectory(root)
    assert.strictEqual(platformInfo.version, '2.11.0')
    assert.strictEqual(platformInfo.platformDirectory, fs.realpathSync(path.join(root, 'node_modules/@mpxjs/webpack-plugin/lib/platform')))
    assert.throws(() => resolvePlatformDirectory(path.join(root, 'missing')), /Project root is not a directory/)

    const compatible = getFindings(report, 'COMPAT_UNDERSCORE_MODE')
    assert.strictEqual(compatible.length, 1)

    const imports = getFindings(report, 'EXTERNAL_TEMPLATE_SOURCE_MODE')
    assert.strictEqual(imports.length, 2)
    assert.strictEqual(imports.some((finding) => finding.file === 'src/map.ali.mpx'), true)
    assert.strictEqual(imports.some((finding) => finding.file === 'src/page.mpx'), true)

    process.stdout.write('scan-project fixtures passed\n')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

run()
