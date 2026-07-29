const KEY_ESCAPE_SUFFIX = 'MpxEscape'

module.exports = function escapeClassObjectKey (str) {
  const result = str.replace(/-/g, '_da_').replace(/\s+/g, '_sp_')
  if (result !== str) return result + KEY_ESCAPE_SUFFIX
  return str
}
