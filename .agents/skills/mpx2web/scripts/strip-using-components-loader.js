'use strict'

// Web 编译校验的旧版本兜底：当前 @mpxjs/webpack-plugin 已支持
// `partialCompileRules.components`，可在 resolver 层把非目标组件替换为
// 默认占位组件。若业务项目安装的旧版插件缺少该能力，校验脚本才会启用
// 这个前置 loader，在源码层移除目标 .mpx 的 usingComponents，避免递归编译
// 子组件。该兜底会跳过 usingComponents 对应的依赖解析与 json-compiler 校验，
// 只用于尽量跑出目标文件自身的 Web 编译错误。

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
