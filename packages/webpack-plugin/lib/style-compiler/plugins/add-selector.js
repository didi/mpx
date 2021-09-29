const postcss = require('postcss')

module.exports = postcss.plugin('add-selector', (string) => root => {
  const node = postcss.parse(string).nodes
  root.append(node)
})
