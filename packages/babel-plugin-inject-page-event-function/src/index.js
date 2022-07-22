function getCodeAst (types, sideEffectHookName) {
  const newAst = types.ObjectProperty(
    types.Identifier(sideEffectHookName),
    types.FunctionExpression(
      // id
      null,
      // params
      [],
      // body
      types.BlockStatement(
        // body
        [types.ReturnStatement(
          // argument
          types.CallExpression(
            // callee
            types.MemberExpression(
              types.MemberExpression(
                types.ThisExpression(),
                types.Identifier('__mpxProxy')
              ),
              types.Identifier('callHook')
            ),
            // arguments
            [types.StringLiteral(`__${sideEffectHookName}__`)]
          )
        )]
      )
    )
  )
  return newAst
}

module.exports = ({ types }) => {
  // Todo check 要处理的页面事件是不是以下这些
  const SideEffectHookName = [
    'onPullDownRefresh',
    'onReachBottom',
    'onShareAppMessage',
    'onShareTimeline',
    'onAddToFavorites',
    'onPageScroll'
    // 'onResize',
    // 'onTabItemTap',
    // 'onSaveExitState'
  ]
  return {
    name: 'inject-composition-api-page-event-function',
    visitor: {
      Identifier (path, state) {
        // 节点name
        const name = path.node.name
        // 标记是否为页面
        if (name === 'createPage' && path.isReferencedIdentifier()) {
          state.isPage = true
          return
        }
        // 节点name包含关键字 && 标识符被引用
        if (SideEffectHookName.includes(name) && path.isReferencedIdentifier() && !state.sideEffectHooks.includes(name)) {
          state.sideEffectHooks.push(name)
          return
        }
        path.skip()
      },
      Property: {
        exit (path, state) {
          const node = path.node
          if (types.isIdentifier(node.key) && node.key.name === 'setup' && types.isFunctionExpression(node.value) && state.sideEffectHooks.length) {
            state.sideEffectHooks.forEach(item => {
              const newAst = getCodeAst(types, item)
              path.insertAfter(newAst)
            })
          }
          path.skip()
        }
      },
      Program (path, state) {
        state.sideEffectHooks = []
        state.isPage = false
      }
    }
  }
}
