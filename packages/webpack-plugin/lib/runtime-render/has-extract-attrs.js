module.exports = function (el) {
  const res = el.attrsList.find(attr => {
    return !(/^(class|style|id)$/).test(attr) || attr.startsWith('data-')
  })
  return Boolean(res)
}
