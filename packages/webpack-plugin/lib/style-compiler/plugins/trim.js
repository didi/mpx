
module.exports = (opts) => {
  return {
    postcssPlugin: 'trim',
    Once: (root) => {
      root.walk(({ type, raws }) => {
        if (type === 'rule' || type === 'atrule') {
          raws.before = raws.after = '\n'
        }
      })
    }
  }
}

module.exports.postcss = true
