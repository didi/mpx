module.exports = function (source) {
  // 处理app引入
  return `
${source}
<style>
  @import "uno.css";
</style>`
}
