'use strict'

// 兼容回退实现：当宿主项目 @mpxjs/webpack-plugin < 2.10.20，缺少
// `partialCompileRules.components` 能力时，通过前置 loader 在源码层面
// 移除目标 .mpx 文件 JSON 块/脚本块中的 usingComponents 字段，绕开
// 子组件的递归编译。该实现属于"不完美兼容"——会同时丢失 usingComponents
// 字段对应的依赖解析与 json-compiler 校验，请尽量升级到 2.10.20+ 使用
// resolver 级 partialCompile 替代。

function removeUsingComponents (source) {
  const re = /(["']?)usingComponents\1\s*:\s*\{/g
  let out = source
  let match
  let guard = 0
  while ((match = re.exec(out)) !== null) {
    if (guard++ > 50) break
    const startBrace = match.index + match[0].length - 1
    let depth = 1
    let i = startBrace + 1
    let inStr = null
    while (i < out.length && depth > 0) {
      const c = out[i]
      if (inStr) {
        if (c === '\\') { i += 2; continue }
        if (c === inStr) inStr = null
      } else if (c === '"' || c === '\'') {
        inStr = c
      } else if (c === '{') {
        depth++
      } else if (c === '}') {
        depth--
      }
      i++
    }
    if (depth === 0) {
      out = out.slice(0, startBrace) + '{}' + out.slice(i)
      re.lastIndex = startBrace + 2
    } else {
      break
    }
  }
  return out
}

module.exports = function stripUsingComponentsLoader (source) {
  const callback = this.async()
  try {
    callback(null, removeUsingComponents(source))
  } catch (err) {
    callback(err)
  }
}

module.exports.removeUsingComponents = removeUsingComponents
