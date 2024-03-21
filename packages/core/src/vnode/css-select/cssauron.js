import tokenizer from './tokenizer'

export default function language (lookups, matchComparison) {
  return function (selector, moduleId) {
    return parse(
      selector,
      remap(lookups),
      moduleId,
      matchComparison || caseSensitiveComparison
    )
  }
}

function remap (opts) {
  // 对于字符串类型的 value 转化为函数
  for (const key in opts) {
    if (opt_okay(opts, key)) {
      /* eslint-disable-next-line */
      opts[key] = Function(
        'return function(node, attr) { return node.' + opts[key] + ' }'
      )
      opts[key] = opts[key]()
    }
  }

  return opts
}

function opt_okay (opts, key) {
  return Object.prototype.hasOwnProperty.call(opts, key) && typeof opts[key] === 'string'
}

function parse (selector, options, moduleId, matchComparison) {
  const stream = tokenizer()
  // const default_subj = true
  const selectors = [[]]
  let bits = selectors[0]

  // 逆向关系
  const traversal = {
    '': any_parents,
    '>': direct_parent,
    '+': direct_sibling,
    '~': any_sibling
  }

  stream.on('data', group)
  stream.end(selector)

  function group (token) {
    if (token.type === 'comma') {
      selectors.unshift((bits = []))

      return
    }

    // 获取节点之间的关系路径，匹配的规则从右往左依次进行，因此在后面的匹配规则需要存储在栈结构的前面
    if (token.type === 'op' || token.type === 'any-child') {
      bits.unshift(traversal[token.data]) // 获取节点之间关系的操作数
      bits.unshift(check()) // 添加空的匹配操作数

      return
    }

    bits[0] = bits[0] || check()
    const crnt = bits[0]

    if (token.type === '!') {
      crnt.subject = selectors[0].subject = true

      return
    }

    crnt.push(
      token.type === 'class'
        ? listContains(token.type, token.data)
        : token.type === 'attr'
          ? attr(token)
          : token.type === ':' || token.type === '::'
            ? pseudo(token)
            : token.type === '*'
              ? Boolean
              : matches(token.type, token.data, matchComparison)
    )
  }

  return selector_fn

  // 单节点对比
  function selector_fn (node, as_boolean) {
    if (node.data?.moduleId !== moduleId) {
      return
    }
    let current, length, subj

    const orig = node
    const set = []

    for (let i = 0, len = selectors.length; i < len; ++i) {
      bits = selectors[i]
      current = entry // 当前 bits 检测规则
      length = bits.length
      node = orig // 引用赋值
      subj = []

      let j = 0
      // 步长为2，因为2个节点之间的关系中间会有一个 OP 操作符
      for (j = 0; j < length; j += 2) {
        node = current(node, bits[j], subj)

        if (!node) {
          break
        }

        // todo 这里的规则和步长设计的很巧妙
        current = bits[j + 1] // 改变当前的 bits 检测规则
      }

      if (j >= length) {
        if (as_boolean) {
          return true
        }

        add(!bits.subject ? [orig] : subj)
      }
    }

    if (as_boolean) {
      return false
    }

    return !set.length ? false : set.length === 1 ? set[0] : set

    function add (items) {
      let next

      while (items.length) {
        next = items.shift()

        if (set.indexOf(next) === -1) {
          set.push(next)
        }
      }
    }
  }

  // 匹配操作数
  function check () {
    _check.bits = []
    _check.subject = false
    _check.push = function (token) {
      _check.bits.push(token)
    }

    return _check

    function _check (node, subj) {
      for (let i = 0, len = _check.bits.length; i < len; ++i) {
        if (!_check.bits[i](node)) {
          return false
        }
      }

      if (_check.subject) {
        subj.push(node)
      }

      return true
    }
  }

  function listContains (type, data) {
    return function (node) {
      let val = options[type](node)
      val = Array.isArray(val) ? val : val ? val.toString().split(/\s+/) : []
      return val.indexOf(data) >= 0
    }
  }

  function attr (token) {
    return token.data.lhs
      ? valid_attr(options.attr, token.data.lhs, token.data.cmp, token.data.rhs)
      : valid_attr(options.attr, token.data)
  }

  function matches (type, data, matchComparison) {
    return function (node) {
      return matchComparison(type, options[type](node), data)
    }
  }

  function any_parents (node, next, subj) {
    do {
      node = options.parent(node)
    } while (node && !next(node, subj))

    return node
  }

  function direct_parent (node, next, subj) {
    node = options.parent(node)

    return node && next(node, subj) ? node : null
  }

  function direct_sibling (node, next, subj) {
    const parent = options.parent(node)
    let idx = 0

    const children = options.children(parent)

    for (let i = 0, len = children.length; i < len; ++i) {
      if (children[i] === node) {
        idx = i

        break
      }
    }

    return children[idx - 1] && next(children[idx - 1], subj)
      ? children[idx - 1]
      : null
  }

  function any_sibling (node, next, subj) {
    const parent = options.parent(node)

    const children = options.children(parent)

    for (let i = 0, len = children.length; i < len; ++i) {
      if (children[i] === node) {
        return null
      }

      if (next(children[i], subj)) {
        return children[i]
      }
    }

    return null
  }

  function pseudo (token) {
    return valid_pseudo(options, token.data, matchComparison)
  }
}

function entry (node, next, subj) {
  return next(node, subj) ? node : null
}

function valid_pseudo (options, match, matchComparison) {
  switch (match) {
    case 'empty':
      return valid_empty(options)
    case 'first-child':
      return valid_first_child(options)
    case 'last-child':
      return valid_last_child(options)
    case 'root':
      return valid_root(options)
  }

  if (match.indexOf('contains') === 0) {
    return valid_contains(options, match.slice(9, -1))
  }

  if (match.indexOf('any') === 0) {
    return valid_any_match(options, match.slice(4, -1), matchComparison)
  }

  if (match.indexOf('not') === 0) {
    return valid_not_match(options, match.slice(4, -1), matchComparison)
  }

  if (match.indexOf('nth-child') === 0) {
    return valid_nth_child(options, match.slice(10, -1))
  }

  return function () {
    return false
  }
}

function valid_not_match (options, selector, matchComparison) {
  const fn = parse(selector, options, matchComparison)

  return not_function

  function not_function (node) {
    return !fn(node, true)
  }
}

function valid_any_match (options, selector, matchComparison) {
  const fn = parse(selector, options, matchComparison)

  return fn
}

function valid_attr (fn, lhs, cmp, rhs) {
  return function (node) {
    const attr = fn(node, lhs)

    if (!cmp) {
      return !!attr
    }

    if (cmp.length === 1) {
      return attr === rhs
    }

    if (attr === undefined || attr === null) {
      return false
    }

    return checkattr[cmp.charAt(0)](attr, rhs)
  }
}

function valid_first_child (options) {
  return function (node) {
    return options.children(options.parent(node))[0] === node
  }
}

function valid_last_child (options) {
  return function (node) {
    const children = options.children(options.parent(node))

    return children[children.length - 1] === node
  }
}

function valid_empty (options) {
  return function (node) {
    return options.children(node).length === 0
  }
}

function valid_root (options) {
  return function (node) {
    return !options.parent(node)
  }
}

function valid_contains (options, contents) {
  return function (node) {
    return options.contents(node).indexOf(contents) !== -1
  }
}

function valid_nth_child (options, nth) {
  let test = function () {
    return false
  }
  if (nth === 'odd') {
    nth = '2n+1'
  } else if (nth === 'even') {
    nth = '2n'
  }
  const regexp = /( ?([-|+])?(\d*)n)? ?((\+|-)? ?(\d+))? ?/
  const matches = nth.match(regexp)
  if (matches) {
    let growth = 0
    if (matches[1]) {
      const positiveGrowth = matches[2] !== '-'
      growth = parseInt(matches[3] === '' ? 1 : matches[3])
      growth = growth * (positiveGrowth ? 1 : -1)
    }
    let offset = 0
    if (matches[4]) {
      offset = parseInt(matches[6])
      const positiveOffset = matches[5] !== '-'
      offset = offset * (positiveOffset ? 1 : -1)
    }
    if (growth === 0) {
      if (offset !== 0) {
        test = function (children, node) {
          return children[offset - 1] === node
        }
      }
    } else {
      test = function (children, node) {
        const validPositions = []
        const len = children.length
        for (let position = 1; position <= len; position++) {
          const divisible = (position - offset) % growth === 0
          if (divisible) {
            if (growth > 0) {
              validPositions.push(position)
            } else {
              if ((position - offset) / growth >= 0) {
                validPositions.push(position)
              }
            }
          }
        }
        for (let i = 0; i < validPositions.length; i++) {
          if (children[validPositions[i] - 1] === node) {
            return true
          }
        }
        return false
      }
    }
  }
  return function (node) {
    const children = options.children(options.parent(node))

    return test(children, node)
  }
}

const checkattr = {
  $: check_end,
  '^': check_beg,
  '*': check_any,
  '~': check_spc,
  '|': check_dsh
}

function check_end (l, r) {
  return l.slice(l.length - r.length) === r
}

function check_beg (l, r) {
  return l.slice(0, r.length) === r
}

function check_any (l, r) {
  return l.indexOf(r) > -1
}

function check_spc (l, r) {
  return l.split(/\s+/).indexOf(r) > -1
}

function check_dsh (l, r) {
  return l.split('-').indexOf(r) > -1
}

function caseSensitiveComparison (type, pattern, data) {
  return pattern === data
}
