const { matchCondition } = require('./match-condition')

const hasTypedRules = rules => !!(rules && (rules.pages || rules.page || rules.components || rules.component))

const getPartialCompileRules = (rules, type) => {
  if (!rules) return null

  if (type === 'page') {
    return rules.pages || rules.page || (hasTypedRules(rules) ? null : rules)
  }

  if (type === 'component') {
    return rules.components || rules.component || null
  }

  return null
}

const isPartialCompileExcluded = (resourcePath, rules, type) => {
  const targetRules = getPartialCompileRules(rules, type)
  return !!(targetRules && !matchCondition(resourcePath, targetRules))
}

module.exports = {
  getPartialCompileRules,
  isPartialCompileExcluded
}
