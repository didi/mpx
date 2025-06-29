/**
 * ```vue
 * <view>
 *     text1 {{ text2 }} text3 {{ text4 }}
 *              ^^^^^             ^^^^^
 * </view>

 * ```
 * @param content
 * @returns
 */
module.exports.parseMpxExpression = function parseMpxExpression (content = '') {
  // const cachedExprResult = slotExpressionCache.get(content)

  // if (cachedExprResult) {
  //   return cachedExprResult
  // }

  let offset = 0

  const exprs = []

  while (content.indexOf('{{', offset) !== -1) {
    const start = content.indexOf('{{', offset)
    let end = content.indexOf('}}', offset)
    if (start === -1 || end === -1) {
      break
    }

    // expect:
    // `{{{ auto: index }}}`
    //  ^^               ^^

    if (end !== -1) {
      let endOffset = end + 2

      while (endOffset < content.length && content[endOffset] === '}') {
        endOffset++
      }

      if (endOffset !== end + 2) {
        end = endOffset - 2
      }
    }

    const expr = content.slice(start + 2, end)
    const startOffset = start + 2

    exprs.push([expr, startOffset])

    offset = end + 2
  }

  // const result = exprs.flatMap((item) => traverseExpression(...item));

  // slotExpressionCache.set(content, result);

  return exprs
}
