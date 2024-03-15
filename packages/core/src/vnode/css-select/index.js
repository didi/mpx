import cssauron from './cssauron'

const language = cssauron({
  tag: function (node) {
    return node.nodeType
  },
  class: function (node) {
    return node.data?.class
  },
  id: function (node) {
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

  if (vtree.nodeType != null) {
    const node = {}
    node.parent = parent
    node.vtree = vtree
    node.nodeType = normalizeTagCase(vtree.nodeType)
    if (vtree.data) {
      node.data = vtree.data
    }

    if (vtree.children) {
      node.children = vtree.children
        .map(function (child) {
          return mapTree(child, node, options)
        })
        .filter(Boolean)
    }
    return node
  }
}
