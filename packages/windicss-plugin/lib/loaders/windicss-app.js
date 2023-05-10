module.exports = function (source) {
  // 处理app引入
  const content = 'import "windi.css";\n'
  return content + source
}
