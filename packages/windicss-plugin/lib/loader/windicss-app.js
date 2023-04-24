module.exports = function (source) {
  // 处理app引入
  const content = "import 'virtual:windi.css';\n"
  return content + source
}
