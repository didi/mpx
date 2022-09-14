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
        if (!name || name !== Page) path.skip()
        if (name === Page) {
          state.isPage = true
          return
        }
        if (SideEffectHookName.includes(name) && !state.sideEffectHooks.includes(name)) {
          state.sideEffectHooks.push(name)
          return
        }
        path.skip()
      },
      Program: {
        enter (path, state) {
          state.sideEffectHooks = []
          state.isPage = false
        },
        exit (path, state) {
          if (state.isPage && state.sideEffectHooks.length) {
            let pageEventsFun = ''
            state.sideEffectHooks.forEach((item, idx) => {
              pageEventsFun += `${item}: function ${item}(e) { return this.__mpxProxy.callHook('__${item}__', [e]) }`
              if (idx + 1 !== state.sideEffectHooks.length) pageEventsFun += ','
            })
            const code = `global.currentInject.pageEvents = {${pageEventsFun}}`
            const newAst = parse(code)
            path.node.body.unshift(newAst.program.body[0])
          }
          // state.sideEffectHooks = []
          // state.isPage = false
        }
      }
    }
  }
}
