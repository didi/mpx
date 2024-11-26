const CSS_LANG_EXT_ARR = ['.less', '.styl', '.sass', '.scss', '.less', '.css']

module.exports = function isCSSFileName (extname) {
  return CSS_LANG_EXT_ARR.includes(extname)
}
