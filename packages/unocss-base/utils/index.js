const EMPTY = ' '

const ruleCallback = ([match], { generator }) => {
  generator._mpx2rnUnsuportedRules = generator._mpx2rnUnsuportedRules || []
  generator._mpx2rnUnsuportedRules.push(match)
  return EMPTY
}

const genEmptyRule = (...rules) => {
  return rules.map(rule => [rule, ruleCallback])
}

const transformEmptyRule = (...rulesArr) => {
  return rulesArr.map(rules => rules.map(rule => [rule[0], ruleCallback])).reduce((preV, curV) => preV.concat(curV), [])
}

module.exports = {
  genEmptyRule,
  transformEmptyRule
}
