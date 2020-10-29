/* 
** 快应用运行时无缓存机制，每次进入页面需重新获取当前页面配置options
 */

module.exports = function(source) {
  const export__ = `\nexport default context.currentOption`

  return source + export__
}