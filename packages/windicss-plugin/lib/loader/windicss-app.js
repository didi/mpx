module.exports = function (source) {
  // 处理app引入
  // const { virtualModulePath } = this.getOptions()
  // 异步引用windi强行提升优先级
  const content = "import('windi.css');\n"
  return content + source
}
