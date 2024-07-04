module.exports = (cssList = []) => {
  // Work with options here

  return {
    postcssPlugin: 'css-array-list',
    /*
    Root (root, postcss) {
      // Transform CSS AST here
    }
    */

    Rule (rule) {
      // todo 特殊字符的处理，vtree 内部是否有做处理
      const selector = rule.selector.trim().replace('\n', '')
      let decls = ''
      if (rule.nodes && rule.nodes.length) {
        rule.nodes.forEach(item => {
          decls += `${item.prop}: ${item.value}; `
        })
      }
      cssList.push([selector, decls])
    }
  }
}

module.exports.postcss = true
