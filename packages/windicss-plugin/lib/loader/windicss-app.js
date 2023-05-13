const { parseComponent } = require('../parser')
function getWindicss (styles) {
  if (!styles.length) return
  return styles.find(item => /^(virtual:)?windi(-(base|components|utilities))?\.css$/.test(item.src))
}
module.exports = function (source) {
  // 处理app引入
  const { mode, env } = this.getMpx()
  const filePath = this.resourcePath
  const output = parseComponent(source, {
    mode,
    filePath,
    pad: 'line',
    env
  })
  let newsource
  // 如果已经引入了不再重复引入
  if (getWindicss(output.styles)) {
    newsource = source
  } else {
    newsource = "<style src='windi.css'/>\n" + source
  }
  return newsource
}
