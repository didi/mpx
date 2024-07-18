const uselessAttrs = ['parent', 'exps', 'unary', 'attrsMap']
const uselessArrAttrs = ['children', 'attrsList']

function stringify (ast) {
  return JSON.stringify(ast, (k, v) => {
    if (uselessAttrs.includes(k)) return undefined
    if (uselessArrAttrs.includes(k) && v && !v.length) return undefined
    if (k === 'tag' && v === 'temp-node') return 'block'
    return v
  })
}

module.exports.stringify = stringify
