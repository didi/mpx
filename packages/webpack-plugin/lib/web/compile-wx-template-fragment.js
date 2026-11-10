/**
 * 将 serialize 得到的 **wxml template** 定义片段（单根 HTML）在构建期编译为 Vue 2.7 render / staticRenderFns。
 * 与业务依赖的 `vue` 包对齐：使用 `vue/compiler-sfc` 的 `compileTemplate`（同 vue-loader / @vue/compiler-sfc 与 runtime 配对），运行期仅需 `vue.runtime`。
 */

const path = require('path')

function tryRequireVueCompilerSfc () {
  try {
    return require('vue/compiler-sfc')
  } catch (e) {
    try {
      const vueRoot = path.dirname(require.resolve('vue/package.json'))
      return require(path.join(vueRoot, 'compiler-sfc'))
    } catch (e2) {
      throw new Error(
        '[Mpx] Failed to load vue/compiler-sfc. Install vue@^2.7 (same version as your app, e.g. 2.7.16) for Web wxml template compilation.'
      )
    }
  }
}

function normalizeCompileErrors (errors) {
  if (!errors || !errors.length) return ''
  return errors.map((e) => (typeof e === 'string' ? e : (e && e.msg) || String(e))).join('\n')
}

/**
 * @param {string} source 单根片段（与 serializeWxTemplateDefinition 输出一致，对应 wxml 侧 `<template name="…">` 体）
 * @param {{ emitError?: (msg: string) => void, definitionName?: string, resourcePath?: string, isProduction?: boolean }} ctx
 * @returns {{ block: string }} `block` 为含 `var render` / `var staticRenderFns` 的脚本片段（与 compileTemplate 的 `code` 一致）
 */
function compileTemplateFragment (source, ctx) {
  const { compileTemplate } = tryRequireVueCompilerSfc()
  const filename = ctx.resourcePath || `wxml-template-${ctx.definitionName || 'anon'}.html`
  const result = compileTemplate({
    source,
    filename,
    isProduction: ctx.isProduction
  })
  const where = ctx.definitionName
    ? `wxml template "${ctx.definitionName}"`
    : (ctx.resourcePath || 'wxml template fragment')
  if (result.errors && result.errors.length) {
    const msg = normalizeCompileErrors(result.errors)
    const full = `Web ${where} compile error: ${msg}`
    if (ctx.emitError) ctx.emitError(full)
    throw new Error(full)
  }
  return {
    block: result.code
  }
}

/**
 * 用 compileTemplate 产出的 `block` 包一层 IIFE，再调用 createTemplateComponent（block 内已声明 `render` / `staticRenderFns`）。
 * 用于将 wxml template 的 Web 侧子组件选项与宿主 `createTemplateComponent` 对接。
 * @param {string} block compileTemplate 返回的 `code`
 * @param {string} innerOptionProps createTemplateComponent 除 render/staticRenderFns 外的选项片段，例如 `name: "x", components: ...`
 */
function wrapCreateTemplateComponentWithBlock (block, innerOptionProps) {
  return `(function () {\n${block}\n  return createTemplateComponent({ render, staticRenderFns, ${innerOptionProps} })\n})()`
}

module.exports = {
  compileTemplateFragment,
  wrapCreateTemplateComponentWithBlock
}
