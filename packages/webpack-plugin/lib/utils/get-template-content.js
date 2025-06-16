/*
 对template.wxml文件做截取
 @source原始小程序文件
 @name 要匹配的该name的template
 */
module.exports = function (source, name) {
  // 使用正则表达式匹配具有 name 的 template 标签及其所有子元素
  // 正则表达式使用非贪婪匹配来递归匹配嵌套的 template
  const regex = new RegExp(`(<template[^>]*\\bname=["|']${name}["|'][^>]*>).*?`, 'g')

  let startIndex = 0
  let endIndex = 0
  const match = regex.exec(source)
  
  // 逐个处理匹配到的 template 标签及其内容
  if (match) {
    // console.log(match, 'match')
    const matchRes = match[0]
    const reg = /<\/?template\s*[^>]*>/g
    let n = 1
    startIndex = match.index
    endIndex = startIndex + matchRes.length
    let html = source.slice(endIndex)
    const matchHtml = html.match(reg)
    const len = matchHtml?.length || 0
    let l = 0
    while (l < len) {
      const matchTemp = matchHtml[l]
      const matchIndex = html.indexOf(matchTemp)
      const matchLength = matchTemp.length
      const cutLength = matchIndex + matchLength
      if (matchTemp.startsWith('</template>')) {
        if (--n === 0) {
          endIndex += cutLength
          break
        }
      } else if (!matchTemp.endsWith('/>')) {
        n++
      }
      endIndex += cutLength
      html = html.slice(cutLength)
      l++
    }
  } else {
    return ''
  }
  return source.slice(startIndex, endIndex)
}
