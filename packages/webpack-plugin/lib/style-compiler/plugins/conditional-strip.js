const postcss = require('postcss')

/**
 * 按平台条件编译CSS，用法如下：
 * @type {postcss.Plugin<any>}
 */
// `
//   /*
//     @mpx-if (
//     __mpx_mode__ === 'wx' ||
//     __mpx_mode__ === 'qq'
//     )
//     */
//     /* @mpx-if (__mpx_mode__ === 'wx') */
//     wx {
//     background: green;
//     }
//     /*
//     @mpx-elif (__mpx_mode__ === 'qq')
//     */
//     qq {
//     background: black;
//     }
//     /* @mpx-endif */
//     /* @mpx-if (__mpx_mode__ === 'swan') */
//     swan {
//     background: cyan;
//     }
//     /* @mpx-endif */
//     always {
//     background: white;
//     }
//     /*
//     @mpx-else
//     */
//     other {
//     /* @mpx-if (__mpx_mode__ === 'swan') */
//     background: blue;
//     /* @mpx-else */
//     background: red;
//     /* @mpx-endif */
//     }
//     /*
//     @mpx-endif
//     */
// `
module.exports = postcss.plugin('conditional-strip', (options = {}) => {

  const { mode, defs } = options

  const defKeys = Object.keys(defs)
  const defValues = defKeys.map((key) => {
    return defs[key]
  })

  function evalExp (exp) {
    /* eslint-disable no-new-func */
    const f = new Function('__mpx_mode__', ...defKeys, `return ${exp};`)
    return f(mode, ...defValues)
  }

  function isIfStart (content) {
    return /@mpx-if/.test(content)
  }

  function isElseIf (content) {
    return /@mpx-elif/.test(content)
  }

  function isElse (content) {
    return /@mpx-else/.test(content)
  }

  function isEndIf (content) {
    return /@mpx-endif/.test(content)
  }

  function parseCondition (regex, content) {
    const exp = regex.exec(content)[1].trim()
    const shouldRemove = !evalExp(exp)
    return {
      shouldRemove,
      children: []
    }
  }

  function parseIf (content) {
    return parseCondition(/@mpx-if[^(]*?\(([\s\S]*)\)/, content)
  }

  function parseElseIf (content) {
    return parseCondition(/@mpx-elif[^(]*?\(([\s\S]*)\)/, content)
  }

  return function (root, result) {
    const condsStacks = []
    const currentConds = []
    let curDepth = -1

    root.walk(node => {
      let isKeyword = false
      if (node.type === 'comment') {
        const { text } = node
        if (isIfStart(text)) {
          isKeyword = true
          const cond = parseIf(text)
          curDepth++
          const parentCond = currentConds[curDepth - 1]
          if (parentCond && parentCond.shouldRemove) {
            cond.shouldRemove = true
          }
          cond.children.push(node)
          condsStacks.push({
            if: cond
          })
          currentConds[curDepth] = cond
        } else if (isElseIf(text)) {
          isKeyword = true
          const cond = parseElseIf(text)
          const parentCond = currentConds[curDepth - 1]
          if (parentCond && parentCond.shouldRemove) {
            cond.shouldRemove = true
          }
          cond.children.push(node)
          condsStacks[curDepth].elif = cond
          currentConds[curDepth] = cond
        } else if (isElse(text)) {
          isKeyword = true
          const curConds = condsStacks[curDepth]
          const cond = {
            shouldRemove: !(curConds.if.shouldRemove && (!curConds.elif || curConds.elif.shouldRemove)),
            children: [node]
          }
          const parentCond = currentConds[curDepth - 1]
          if (parentCond && parentCond.shouldRemove) {
            cond.shouldRemove = true
          }
          condsStacks[curDepth].else = cond
          currentConds[curDepth] = cond
        } else if (isEndIf(text)) {
          isKeyword = true
          const curConds = condsStacks.pop()
          Object.keys(curConds).forEach(k => {
            curConds[k].children.forEach(node => {
              node.remove()
            })
          })
          currentConds.pop()
          curDepth--
          node.remove()
        }
      }

      if (!isKeyword) {
        const curCond = currentConds[curDepth]
        if (curCond && curCond.shouldRemove) {
          curCond.children.push(node)
        }
      }
    })
  }
})
