import { hasOwn } from './object'

function parseSelector (selector) {
  const groups = selector.split(',')
  return groups.map((item) => {
    let id
    let ret = /#([^#.>\s]+)/.exec(item)
    if (ret) id = ret[1]

    const classes = []
    const classReg = /\.([^#.>\s]+)/g
    while (ret = classReg.exec(item)) {
      classes.push(ret[1])
    }
    return {
      id,
      classes
    }
  })
}

function matchSelector (vnode, selectorGroups) {
  let vnodeId
  let vnodeClasses = []
  if (vnode && vnode.data) {
    if (vnode.data.attrs && vnode.data.attrs.id) vnodeId = vnode.data.attrs.id
    if (vnode.data.staticClass) vnodeClasses = vnode.data.staticClass.split(/\s+/)
  }

  if (vnodeId || vnodeClasses.length) {
    for (let i = 0; i < selectorGroups.length; i++) {
      const { id, classes } = selectorGroups[i]
      if (id === vnodeId) return true
      if (classes.length && classes.every((item) => vnodeClasses.includes(item))) {
        return true
      }
    }
  }
  return false
}

function walkChildren (vm, selectorGroups, context, result, all) {
  if (vm.$children && vm.$children.length) {
    for (let i = 0; i < vm.$children.length; i++) {
      const child = vm.$children[i]
      if (child.$vnode.context === context && !child.$options.__mpxBuiltIn) {
        if (matchSelector(child.$vnode, selectorGroups)) {
          result.push(child)
          if (!all) return
        }
      }
      walkChildren(child, selectorGroups, context, result, all)
    }
  }
}

const mpxEscapeReg = /(.+)MpxEscape$/

function parseDataset (dataset) {
  const parsed = {}
  for (const key in dataset) {
    if (hasOwn(dataset, key)) {
      if (mpxEscapeReg.test(dataset[key])) {
        try {
          parsed[key] = JSON.parse(mpxEscapeReg.exec(dataset[key])[1])
        } catch (e) {
          parsed[key] = dataset[key]
        }
      } else {
        parsed[key] = dataset[key]
      }
    }
  }
  return parsed
}

const datasetReg = /^data-(.+)$/

function collectDataset (props, needParse = false) {
  const dataset = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const matched = datasetReg.exec(key)
      if (matched) {
        dataset[matched[1]] = props[key]
      }
    }
  }
  return needParse ? parseDataset(dataset) : dataset
}

export {
  parseDataset,
  collectDataset,
  walkChildren,
  parseSelector
}
