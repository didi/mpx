const language = (sel, moduleId) => {
  return node => {
    return node.d?.class?.split(' ').find(c => sel.substring(1) === c)
      ? node
      : false
  }
}

export default function cssSelect(sel, options) {
  options = options || {}
  const selector = language(sel, options.moduleId)
  function match(vtree) {
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

function traverse(vtree, fn) {
  fn(vtree)
  if (vtree.c) {
    vtree.c.forEach(function (vtree) {
      traverse(vtree, fn)
    })
  }
}

function mapResult(result) {
  return result
    .filter(function (node) {
      return !!node.vtree
    })
    .map(function (node) {
      return node.vtree
    })
}

function getNormalizeCaseFn(caseSensitive) {
  return caseSensitive
    ? function noop(str) {
        return str
      }
    : function toLowerCase(str) {
        return str.toLowerCase()
      }
}

// Map a virtual-dom node tree into a data structure that cssauron can use to
// traverse.
function mapTree(vtree, parent, options) {
  const normalizeTagCase = getNormalizeCaseFn(options.caseSensitiveTag)

  if (vtree.nt != null) {
    const node = {}
    node.p = parent
    node.vtree = vtree
    node.nt = normalizeTagCase(vtree.nt)
    if (vtree.d) {
      node.d = vtree.d
    }

    if (vtree.c) {
      node.c = vtree.c
        .map(function (child) {
          return mapTree(child, node, options)
        })
        .filter(Boolean)
    }
    return node
  }
}
