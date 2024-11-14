const { boxShadowsBase, boxShadows } = require('@unocss/preset-mini/rules')

const findShadowColorRule = () => {
  return boxShadows.find(rule => {
    if (rule[0] instanceof RegExp && rule[0].test('shadow')) {
      return rule
    }
  }) || []
}

const shadowColorRule = findShadowColorRule()

module.exports = [
  [shadowColorRule[0], (match, context) => {
    const rawHandler = shadowColorRule[1]
    const rawResult = rawHandler(match, context)
    if (rawResult['box-shadow']) {
      return {
        ...boxShadowsBase,
        ...rawResult
      }
    } else {
      // 工具类
      return rawResult
    }
  }]
]
