module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx',
        externalClasses: ['custom-class', 'i-class', 'tone-class', 'item-class'],
        autoVirtualHostRules: {
          include: /[\\/]src[\\/]components[\\/]layout-cell\.mpx$/
        }
      }
    }
  }
}
