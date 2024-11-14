const EMPTY = ' '

const genEmptyRule = (...rules) => {
  return rules.map(r => [r, () => EMPTY])
}

const transformEmptyRule = (...rulesArr) => {
  return rulesArr.map(rules => rules.map(rule => [rule[0], () => EMPTY]))
    .reduce((preV, curV) => preV.concat(curV), [])
}

module.exports = {
  genEmptyRule,
  transformEmptyRule
}
