const orMatcher = items => {
  return str => {
    for (let i = 0; i < items.length; i++) {
      if (items[i](str)) return true
    }
    return false
  }
}

export const normalizeCondition = (condition) => {
  if (!condition) throw new Error('Expected condition but got falsy value')
  if (typeof condition === 'string') {
    return str => str.indexOf(condition) === 0
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
