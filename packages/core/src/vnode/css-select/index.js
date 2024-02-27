import cssauron from './cssauron'

const language = cssauron({
  tag: function (node) {
    // #todo 目前的 tag 命名不一致
    return node.nodeType
  },
  class: function (node) {
    // if (node.class !== undefined) {
    //   return node.class
    // }
    return node.data?.class
  },
  id: function (node) {
    // return node.id
    return node.data?.id
  },
  children: function (node) {
    return node.children
  },
  parent: function (node) {
    // todo 不能返回默认值，会导致 cssauron 匹配过程找父节点出现死循环
    // return node.parent || {}
    return node.parent
  },
  contents: function (node) {
    return node.contents || ''
  },
  attr: function (node, attr) {
    if (node.properties) {
      const attrs = node.properties.attributes
      if (attrs && attrs[attr]) {
        return attrs[attr]
      }
      return node.properties[attr]
    }
  }
})

export default function cssSelect (sel, options) {
  options = options || {}
  const selector = language(sel, options.moduleId)
  function match (vtree) {
    const node = mapTree(vtree, null, options) || {}
    const matched = []

    // Traverse each node in the tree and see if it matches our selector
    traverse(node, function (node) {
      let result = selector(node)
      if (result) {
        if (!Array.isArray(result)) {
          result = [result]
        }
        matched.push.apply(matched, result)
      }
    })

    const results = mapResult(matched)
    if (results.length === 0) {
      return null
    }
    return results
  }
  match.matches = function (vtree) {
    const node = mapTree(vtree, null, options)
    return !!selector(node)
  }
  return match
}

function traverse (vtree, fn) {
  fn(vtree)
  if (vtree.children) {
    vtree.children.forEach(function (vtree) {
      traverse(vtree, fn)
    })
  }
}

function mapResult (result) {
  return result
    .filter(function (node) {
      return !!node.vtree
    })
    .map(function (node) {
      return node.vtree
    })
}

function getNormalizeCaseFn (caseSensitive) {
  return caseSensitive
    ? function noop (str) {
      return str
    }
    : function toLowerCase (str) {
      return str.toLowerCase()
    }
}

// Map a virtual-dom node tree into a data structure that cssauron can use to
// traverse.
function mapTree (vtree, parent, options) {
  const normalizeTagCase = getNormalizeCaseFn(options.caseSensitiveTag)
  // const moduleId = options.moduleId
  // VText represents text nodes
  // See https://github.com/Matt-Esch/virtual-dom/blob/master/docs/vtext.md
  // if (vtree.type === 'VirtualText') {
  //   return {
  //     contents: vtree.text,
  //     parent: parent,
  //     vtree: vtree
  //   }
  // }

  // 样式隔离：如果已经进行过样式匹配直接返回
  // if (vtree.scopeProcessed) {
  //   return null
  // }

  if (vtree.nodeType != null) {
    const node = {}
    node.parent = parent
    node.vtree = vtree
    node.nodeType = normalizeTagCase(vtree.nodeType)
    // #todo 取值字段，将 data 当中的数据取出来放置外层节点
    // 依据 moduleId 来确定是否需要匹配
    if (vtree.data) {
    // if (vtree.data?.moduleId === moduleId && vtree.data) {
      node.data = vtree.data
      // if (typeof vtree.data.class === 'string') {
      //   node.class = vtree.data.class
      // }
      // if (typeof vtree.data.id === 'string') {
      //   node.id = vtree.data.id
      // }
    }

    if (vtree.children && typeof vtree.children.map === 'function') {
      node.children = vtree.children
        .map(function (child) {
          return mapTree(child, node, options)
        })
        .filter(Boolean)
    }
    return node
  }
}
