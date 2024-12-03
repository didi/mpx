const color = require('./color')
const spaceing = require('./spaceing')
const typography = require('./typography')
const background = require('./background')
const shadow = require('./shadow')
const behaviors = require('./behaviors')
const layout = require('./layout')
const filters = require('./filters')
const staticRule = require('./static')

module.exports = [
  ...color,
  ...spaceing,
  ...typography,
  ...background,
  ...shadow,
  ...behaviors,
  ...layout,
  ...filters,
  ...staticRule
]
