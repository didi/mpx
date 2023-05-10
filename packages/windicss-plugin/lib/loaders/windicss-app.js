module.exports = function (source) {
  // 处理app引入
  // const { virtualModulePath } = this.getOptions()
  const content = "import 'windi.css';\n"
  return content + source
}
