module.exports = {
  web: {
    directive: {
      if: 'v-if',
      elseif: 'v-else-if',
      else: 'v-else'
    },
    wxs: {
      tag: 'wxs',
      module: 'module',
      src: 'src',
      ext: '.wxs',
      templatePrefix: 'module.exports = \n'
    }
  }
}
