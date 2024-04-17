// react 不支持的 CSS property 集合
const UNSUPPORTED_PROP_ARR = ['box-sizing']
// react CSS property 有不支持的 value 集合
const UNSUPPORTED_PROP_VAL_ARR = {
  'overflow': ['clip', 'auto'],
  'border-style': ['none', 'hidden', 'double', 'groove', 'ridge', 'inset', 'outset']
}



/**
 * @param {function(object): function} print
 * @return {array}
 */
module.exports = function ({ print }) {
  
  const UnsupportedPropError = print({ platform: 'react', isError: true, type: 'prop' })
  const unsupportedPropExp = new RegExp('^(' + UNSUPPORTED_PROP_ARR.join('|') + ')$')
  
  const unsupportedPropValExp = new RegExp('^(' + Object.keys(UNSUPPORTED_PROP_VAL_ARR).join('|') + ')$')
  const UnsupportedPropValError = print({ platform: 'react', isError: true, type: 'value', unsupportedMap: UNSUPPORTED_PROP_VAL_ARR })
  
  
  
  return [
    {
      test: unsupportedPropExp,
      react: UnsupportedPropError
    },
    {
      test: unsupportedPropValExp,
      react: UnsupportedPropValError
    }
  ]
}
