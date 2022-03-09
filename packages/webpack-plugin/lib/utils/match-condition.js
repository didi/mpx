const orMatcher = items => {
  return str => {
    for (let i = 0; i < items.length; i++) {
      if (items[i](str)) return true
    }
    return false
  }
}

const normalizeCondition = (condition) => {
  if (!condition) throw new Error('Expected condition but got falsy value')
  if (typeof condition === 'string') {
    return str => str.indexOf(condition) !== -1
  }
  if (typeof condition === 'function') {
    return condition
  }
  if (condition instanceof RegExp) {
    return condition.test.bind(condition)
  }
  if (Array.isArray(condition)) {
    const items = condition.map(c => normalizeCondition(c))
    return orMatcher(items)
  }
  throw Error(
    'Unexcepted ' +
    typeof condition +
    ' when condition was expected (' +
    condition +
    ')'
  )
}

// 匹配规则为include匹配到且未被exclude匹配到的资源为true，其余资源全部为false，如果需要实现不传include为全部匹配的话可以将include的默认值设置为()=>true进行传入
const matchCondition = (resourcePath, condition = {}) => {
  let matched = false
  const includeMatcher = condition.include && normalizeCondition(condition.include)
  const excludeMatcher = condition.exclude && normalizeCondition(condition.exclude)
  if (includeMatcher && includeMatcher(resourcePath)) {
    matched = true
  }
  if (excludeMatcher && excludeMatcher(resourcePath)) {
    matched = false
  }
  return matched
}

module.exports = {
  matchCondition,
  normalizeCondition
}
