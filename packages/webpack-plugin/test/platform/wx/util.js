const compiler = require('../../../lib/template-compiler/compiler')

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

/**
 * 准备compiler，放入输入，序列化输出
 * @param {string} input 要编译的内容
 * @param {object} option compiler parse的配置项
 * @param {string} option.srcMode 目前仅支持wx
 * @param {string} option.mode 目标模式，默认ali
 * @param {object=} option.customTransSpec 自定义转换规则
 * @return {string} 转换结果
 */
function compileAndParse (input, { srcMode, mode, customTransSpec } = { srcMode: 'wx', mode: 'ali' }) {
  const parsed = compiler.parse(input, {
    usingComponents: [],
    srcMode,
    mode,
    warn: warnFn,
    error: errorFn,
    defs: {
      '__mpx_mode__': mode,
      '__mpx_src_mode__': srcMode
    },
    customTransSpec
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

module.exports = {
  errorFn,
  warnFn,
  compileAndParse
}
