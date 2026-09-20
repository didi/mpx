/* 微信 workers 目录中的 CommonJS 模块；Web 构建不会自动把它转成浏览器 Worker。 */
module.exports = function add (left, right) {
  return left + right
}
