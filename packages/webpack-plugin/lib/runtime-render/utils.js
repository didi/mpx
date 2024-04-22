const directiveSet = new Set()
const commonBaseAttrs = ['class', 'style', 'id', 'hidden']
const commonMpxAttrs = ['mpxShow', 'slots']

function genRegExp (arrStr) {
  return new RegExp(`^(${arrStr.join('|')})$`)
}

module.exports = {
  hasExtractAttr (el) {
    const res = Object.keys(el.attrsMap).find(attr => {
      return !(genRegExp(commonBaseAttrs).test(attr) || attr.startsWith('data-'))
    })
    return Boolean(res)
  },
  isCommonAttr (attr) {
    return genRegExp([...commonBaseAttrs, ...commonMpxAttrs]).test(attr) || attr.startsWith('data-')
  },
  isDirective (key) {
    return directiveSet.has(key)
  }
}
