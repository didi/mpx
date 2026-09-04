const KEY_ESCAPE_SUFFIX = 'MpxEscape'
const keyDecodeMap = {
  _da_: '-',
  _sp_: ' '
}
const keyDecodeReg = /_da_|_sp_/g

function escapeWxsObjectKey (str) {
  const result = str.replace(/-/g, '_da_').replace(/\s+/g, '_sp_')
  if (result !== str) return result + KEY_ESCAPE_SUFFIX
  return str
}

function unescapeWxsObjectKey (str) {
  if (str.endsWith(KEY_ESCAPE_SUFFIX)) {
    return str.slice(0, -KEY_ESCAPE_SUFFIX.length).replace(keyDecodeReg, match => keyDecodeMap[match])
  }
  return str
}

module.exports = escapeWxsObjectKey
module.exports.unescapeWxsObjectKey = unescapeWxsObjectKey
