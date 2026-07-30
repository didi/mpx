const loaderUtils = require('loader-utils')
const templateCompiler = require('../template-compiler/compiler')
const normalize = require('../utils/normalize')
const { MPX_TEMPLATE_COMPONENT_PREFIX } = require('../utils/const')

function getWxTemplateComponentName (definitionName) {
  return MPX_TEMPLATE_COMPONENT_PREFIX + definitionName
}

/**
 * 与 react/processTemplate 中 `<import src>` 一致：`urlToRequest` 解析相对路径后，经 `!!web/template-loader!` 拼出 require 表达式；该模块 `module.exports` 即为具名子组件映射，供 Object.assign 合并。
 */
function buildWebTemplateImportMergeExpr (loaderContext, importSrc, projectRoot) {
  const webTemplateLoaderPath = normalize.lib('web/template-loader')
  const request = loaderUtils.urlToRequest(importSrc, projectRoot)
  const req = loaderUtils.stringifyRequest(loaderContext, `!!${webTemplateLoaderPath}!${request}`)
  return `(require(${req}) || {})`
}

/**
 * 将 `<template name="...">` 定义节点的子树序列化为 wx 风格 web 模版组件可用的 HTML 字符串。
 * 供 `template-loader`（独立 wxml 链）与 `processTemplate`（.mpx 主模版）共用，规则须保持一致。
 *
 * @param {*} tplNode template 定义 AST 节点
 * @param {(msg: string) => void} emitError 已由调用方带上 [Mpx template error][resource] 等前缀
 * @param {string} [definitionName] name shown in multi-root error; defaults to `tplNode.attrsMap.name`
 * @returns {string}
 */
function serializeWxTemplateDefinition (tplNode, emitError, definitionName) {
  const realChildren = tplNode.children.filter(c => c.type === 1 && c.tag !== 'temp-node')
  if (realChildren.length > 1) {
    const name = definitionName != null ? definitionName : (tplNode.attrsMap && tplNode.attrsMap.name) || ''
    emitError(
      `Web mode does not support multi-root template definition${name ? ` "${name}"` : ''}; please wrap with a single root element.`
    )
  }
  let content = ''
  tplNode.children.forEach((child) => {
    content += templateCompiler.serialize(child)
  })
  return content
}

module.exports = {
  getWxTemplateComponentName,
  serializeWxTemplateDefinition,
  buildWebTemplateImportMergeExpr
}
