const type = require('./utils/type')

const target = 'ali'

const root = {
  directive: {
    key: 'name',
    rules: [
      {
        test: 'wx:if',
        ali ({ value }) {
          return {
            name: 'a:if',
            value
          }
        }
      },
      {
        test: /^(bind|catch|capture-bind|capture-catch):?(.*)$/,
        ali ({ name }, eventRule) {
          runRules(name, eventRule)
        }
      }
    ]
  },
  event: [
    {
      test: 'tap'
    }
  ],
  component: {
    key: 'tag',
    rules: [
      {
        test: 'view',
        ali ({ tag, attrsList }) {
          const eventRule = root.event.concat(this.event || [])
          attrsList.forEach((attr) => {
            runRules(root.directive, attr, eventRule)
            runRules(this.props, attr)
          })
        },
        props: [
          {
            test: 'hover-class',
            ali () {

            }
          }
        ],
        event: [
          {
            test: 'change'
          }
        ]
      },
      {
        test () {
          return true
        },
        ali ({ tag, attrsList }) {
          const eventRule = root.event.concat(this.event || [])
          attrsList.forEach((attr) => {
            runRules(root.directive, 'ali', attr, eventRule)
            runRules(this.props, 'ali', attr)
          })
        }
      }
    ]
  }
}

function normalizeTest (rawTest, context) {
  let testType = type(rawTest)
  switch (testType) {
    case 'Function':
      return rawTest.bind(context)
    case 'RegExp':
      return function (input) {
        return rawTest.test(input)
      }
    case 'String':
      return function (input) {
        return rawTest === input
      }
    default:
      return function () {
        return true
      }
  }
}

function runRules (rawRules, input, options) {
  let rules, testKey
  if (type(rawRules) === 'Array') {
    rules = rawRules
  } else {
    rules = rawRules.rules
    testKey = rawRules.key
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const tester = normalizeTest(rule.test)
    const testInput = testKey ? input[testKey] : input
    const processer = rule[target]
    if (tester(testInput) && processer) {
      return processer.call(rule, input, options)
    }
  }
}
