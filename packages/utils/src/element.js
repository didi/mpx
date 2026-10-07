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

function stringifyClass (value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(stringifyClass).join(' ')
  if (value && typeof value === 'object') {
    return Object.keys(value).filter(key => value[key]).join(' ')
  }
  return ''
}

function matchSelector (vm, selectorGroups) {
  // 多个组件可能共享同一个根 DOM，选择器只匹配组件调用节点上的属性。
  const { data } = vm.$vnode
  if (!data) return false
  let vnodeClasses
  return selectorGroups.some(({ id, classes }) => {
    if ((!id && !classes.length) || (id && id !== (data.attrs && data.attrs.id))) return false
    if (!classes.length) return true
    if (!vnodeClasses) {
      vnodeClasses = `${data.staticClass || ''} ${stringifyClass(data.class)}`.split(/\s+/)
    }
    return classes.every(item => vnodeClasses.includes(item))
  })
}

function walkChildren (vm, selectorGroups, context, result, all) {
  if (vm.$children && vm.$children.length) {
    for (let i = 0; i < vm.$children.length; i++) {
      const child = vm.$children[i]
      if (child.$vnode.context === context && !child.$options.__mpxBuiltIn && !child.$options.__mpxTemplate) {
        if (matchSelector(child, selectorGroups)) {
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
        const attrName = matched[1].replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())
        dataset[attrName] = props[key]
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
