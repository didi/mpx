// 测试 merge-visitors 工具函数
const mergeVisitors = require('../../lib/utils/merge-visitors')

describe('visitor-merge utility', function () {
  it('should be a function', function () {
    expect(typeof mergeVisitors).toBe('function')
  })

  it('should add new methods when no conflict exists', function () {
    const visitor = {}

    mergeVisitors(visitor, {
      CallExpression: function () { return 'call' },
      Identifier: function () { return 'id' }
    })

    expect(typeof visitor.CallExpression).toBe('function')
    expect(typeof visitor.Identifier).toBe('function')
    expect(visitor.CallExpression()).toBe('call')
    expect(visitor.Identifier()).toBe('id')
  })

  it('should compose methods when conflicts exist', function () {
    const visitor = {}
    const executionOrder = []

    // 第一次添加
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('first')
      }
    })

    // 第二次添加相同的方法名
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('second')
      }
    })

    // 执行应该按顺序调用两个方法
    visitor.CallExpression.enter.forEach(fn => fn({}))

    expect(executionOrder).toEqual(['first', 'second'])
  })

  it('should respect path.removed state', function () {
    const visitor = {}
    const executionOrder = []

    // 第一次添加
    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionOrder.push('first')
        path.removed = true
      }
    })

    // 第二次添加相同的方法名
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('second')
      }
    })

    // 模拟 path 对象
    const mockPath = { removed: false }
    visitor.CallExpression.enter.forEach(fn => fn(mockPath))

    // 第一个方法设置了 removed，第二个方法不应该执行
    expect(executionOrder).toEqual(['first', 'second'])
    expect(mockPath.removed).toBe(true)
  })

  it('should handle enter/exit hooks', function () {
    const visitor = {}
    const executionOrder = []

    // 第一次添加
    mergeVisitors(visitor, {
      CallExpression: {
        enter: function () {
          executionOrder.push('first-enter')
        },
        exit: function () {
          executionOrder.push('first-exit')
        }
      }
    })

    // 第二次添加相同的方法名
    mergeVisitors(visitor, {
      CallExpression: {
        enter: function () {
          executionOrder.push('second-enter')
        },
        exit: function () {
          executionOrder.push('second-exit')
        }
      }
    })

    // 对象形式合并后应该是对象形式，enter 和 exit 都是数组
    expect(typeof visitor.CallExpression).toBe('object')
    expect(Array.isArray(visitor.CallExpression.enter)).toBe(true)
    expect(Array.isArray(visitor.CallExpression.exit)).toBe(true)

    // 执行 enter 和 exit 钩子
    visitor.CallExpression.enter.forEach(fn => fn({}))
    visitor.CallExpression.exit.forEach(fn => fn({}))

    expect(executionOrder).toEqual(['first-enter', 'second-enter', 'first-exit', 'second-exit'])
  })

  it('should handle mixed function and object visitors', function () {
    const visitor = {}
    const executionOrder = []

    // 第一次添加函数形式
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('function')
      }
    })

    // 第二次添加对象形式
    mergeVisitors(visitor, {
      CallExpression: {
        enter: function () {
          executionOrder.push('object-enter')
        }
      }
    })

    // 混合形式合并后应该是对象形式
    expect(typeof visitor.CallExpression).toBe('object')
    expect(Array.isArray(visitor.CallExpression.enter)).toBe(true)

    // 执行 enter 钩子
    visitor.CallExpression.enter.forEach(fn => fn({}))

    expect(executionOrder).toEqual(['function', 'object-enter'])
  })

  it('should handle empty visitor', function () {
    const visitor = { CallExpression: function () { return 'existing' } }

    mergeVisitors(visitor, {})

    expect(typeof visitor.CallExpression).toBe('function')
    expect(visitor.CallExpression()).toBe('existing')
  })
})

describe('WXS Pre-loader Visitor Merge', function () {
  it('should handle complex visitor merging scenarios', function () {
    const visitor = {}
    const executionOrder = []

    // 添加基础 visitor
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('base-call')
      },
      MemberExpression: function () {
        executionOrder.push('base-member')
      }
    })

    // 添加扩展 visitor
    mergeVisitors(visitor, {
      CallExpression: function () {
        executionOrder.push('extended-call')
      },
      Identifier: function () {
        executionOrder.push('extended-id')
      }
    })

    // 执行所有方法
    visitor.CallExpression.enter.forEach(fn => fn({}))
    visitor.MemberExpression({})
    visitor.Identifier({})

    expect(executionOrder).toEqual(['base-call', 'extended-call', 'base-member', 'extended-id'])
  })
})

describe('mergeVisitors 解决方案', function () {
  it('CallExpression 合并测试', function () {
    const visitor = {}
    const executionLog = []

    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionLog.push('wx')
      }
    })

    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionLog.push('ali')
      }
    })

    // 模拟执行
    visitor.CallExpression.enter.forEach(fn => fn({}))

    console.log('mergeVisitors CallExpression 解决方案:', executionLog)
    expect(executionLog).toEqual(['wx', 'ali'])
  })

  it('MemberExpression 合并测试', function () {
    const visitor = {}
    const executionLog = []

    mergeVisitors(visitor, {
      MemberExpression: function (path) {
        executionLog.push('wxs')
      }
    })

    mergeVisitors(visitor, {
      MemberExpression: function (path) {
        executionLog.push('dd')
      }
    })

    // 模拟执行
    visitor.MemberExpression.enter.forEach(fn => fn({}))

    console.log('mergeVisitors MemberExpression 解决方案:', executionLog)
    expect(executionLog).toEqual(['wxs', 'dd'])
  })

  it('复杂场景测试', function () {
    const visitor = {}
    const executionLog = []

    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionLog.push('wx')
      }
    })

    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionLog.push('ali')
      }
    })

    // 验证合并后的函数可以正常执行
    expect(typeof visitor.CallExpression).not.toBe('function')
    visitor.CallExpression.enter.forEach(fn => fn({}))
    expect(executionLog).toEqual(['wx', 'ali'])
  })

  it('enter/exit 钩子合并测试', function () {
    const visitor = {}
    const executionLog = []

    mergeVisitors(visitor, {
      CallExpression: {
        enter: function (path) {
          executionLog.push('wx-enter')
        },
        exit: function (path) {
          executionLog.push('wx-exit')
        }
      }
    })

    mergeVisitors(visitor, {
      CallExpression: {
        enter: function (path) {
          executionLog.push('ali-enter')
        },
        exit: function (path) {
          executionLog.push('ali-exit')
        }
      }
    })

    // 执行 enter 钩子
    visitor.CallExpression.enter.forEach(fn => fn({}))
    // 执行 exit 钩子
    visitor.CallExpression.exit.forEach(fn => fn({}))

    expect(executionLog).toEqual(['wx-enter', 'ali-enter', 'wx-exit', 'ali-exit'])
  })

  it('混合函数和对象形式的 visitor', function () {
    const visitor = {}
    const executionLog = []

    // 第一个是函数形式
    mergeVisitors(visitor, {
      CallExpression: function (path) {
        executionLog.push('function-form')
      }
    })

    // 第二个是对象形式
    mergeVisitors(visitor, {
      CallExpression: {
        enter: function (path) {
          executionLog.push('object-enter')
        },
        exit: function (path) {
          executionLog.push('object-exit')
        }
      }
    })

    // 执行
    visitor.CallExpression.enter.forEach(fn => fn({}))
    visitor.CallExpression.exit.forEach(fn => fn({}))

    expect(executionLog).toEqual(['function-form', 'object-enter', 'object-exit'])
  })

  it('测试 visitor 不会相互影响', function () {
    // 创建新的 visitor 对象
    const newVisitor = {}
    const executionLog = []

    mergeVisitors(newVisitor, {
       CallExpression: () => executionLog.push('ali')
     })

     // 再次合并不应该影响原始对象
     mergeVisitors(newVisitor, {
       CallExpression: () => executionLog.push('non-wx')
     })

     // 测试 MemberExpression
     mergeVisitors(newVisitor, {
       MemberExpression: () => executionLog.push('dd')
     })

     // 再次合并不应该影响原始对象
     mergeVisitors(newVisitor, {
       MemberExpression: () => executionLog.push('non-wxs')
     })

     // 验证合并后的函数可以正常执行
     expect(typeof newVisitor.CallExpression).toBe('object')
     expect(typeof newVisitor.MemberExpression).toBe('object')

     newVisitor.CallExpression.enter.forEach(fn => fn({}))
     newVisitor.MemberExpression.enter.forEach(fn => fn({}))

     expect(executionLog).toEqual(['ali', 'non-wx', 'dd', 'non-wxs'])
  })
})
