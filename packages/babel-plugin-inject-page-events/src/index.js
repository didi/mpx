module.exports = ({ parse }) => {
  const sideEffectHookNameMap = [
    'onPullDownRefresh',
    'onReachBottom',
    'onShareAppMessage',
    'onShareTimeline',
    'onAddToFavorites',
    'onPageScroll',
    'onTabItemTap',
    'onSaveExitState'
  ].reduce((obj, item) => {
    obj[item] = true
    return obj
  }, {})

  const Page = 'createPage'
  return {
    name: 'injectPageEvents',
    visitor: {
      CallExpression (path, state) {
        const callee = path.node.callee
        const name = callee && callee.name
        if (name === Page) {
          state.isPage = true
          return
        }
        if (sideEffectHookNameMap[name]) {
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
            const code = `global._i.pageEvents = {${pageEventsFun}};`
            const newAst = parse(code, {
              filename: state.filename
            })
            path.unshiftContainer('body', newAst.program.body)
          }
        }
      }
    }
  }
}
