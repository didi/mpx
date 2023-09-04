module.exports = function (source) {
  // 处理app引入
  return `${source}\n<style src='uno.css'/>`
}
