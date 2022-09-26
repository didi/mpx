module.exports = ({ parse }) => {
  const SideEffectHookName = [
    'onPullDownRefresh',
    'onReachBottom',
    'onShareAppMessage',
    'onShareTimeline',
    'onAddToFavorites',
    'onPageScroll',
    'onTabItemTap',
    'onSaveExitState'
  ]
  const Page = 'createPage'
  return {
    name: 'inject-composition-api-page-event-function',
    visitor: {
      CallExpression (path, state) {
        const callee = path.node.callee
        const name = callee && callee.name
        if (name === Page) {
          state.isPage = true
          return
        }
        if (SideEffectHookName.includes(name)) {
          state.sideEffectHooks.add(name)
        }
      },
      Program: {
        enter (path, state) {
          state.sideEffectHooks = new Set()
          state.isPage = false
        },
        exit (path, state) {
          if (state.isPage && state.sideEffectHooks.size) {
            let pageEventsFun = ''
            state.sideEffectHooks.forEach((item, idx) => {
              pageEventsFun += `${item}: function(e) { return this.__mpxProxy.callHook('__${item}__', [e]) }`
              if (idx + 1 !== state.sideEffectHooks.size) pageEventsFun += ','
            })
            const code = `global.currentInject.pageEvents = {${pageEventsFun}};`
            const newAst = parse(code)
            path.unshiftContainer('body', newAst.program.body)
          }
        }
      }
    }
  }
}
