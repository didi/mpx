// 测试 chain-assgin 工具函数
const chainAssign = require('../../lib/utils/chain-assign')

describe('visitor-merge utility', function () {
  it('should be a function', function () {
    expect(typeof chainAssign).toBe('function')
  })

  it('should add new methods when no conflict exists', function () {
    const visitor = {}

    chainAssign(visitor, {
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
    chainAssign(visitor, {
      CallExpression: function () {
        executionOrder.push('first')
      }
    })

    // 第二次添加相同的方法名
    chainAssign(visitor, {
      CallExpression: function () {
        executionOrder.push('second')
      }
    })

    // 执行应该按顺序调用两个方法
    visitor.CallExpression({})

    expect(executionOrder).toEqual(['first', 'second'])
  })

  it('should respect path.removed state', function () {
    const visitor = {}
    const executionOrder = []

    chainAssign(visitor, {
      CallExpression: function (path) {
        executionOrder.push('first')
        path.removed = true
      }
    })

    chainAssign(visitor, {
      CallExpression: function () {
        executionOrder.push('second')
      }
    })

    visitor.CallExpression({})

    expect(executionOrder).toEqual(['first'])
    expect(executionOrder).not.toContain('second')
  })

  it('should respect path.shouldStop state', function () {
    const visitor = {}
    const executionOrder = []

    chainAssign(visitor, {
      CallExpression: function (path) {
        executionOrder.push('first')
        path.shouldStop = true
      }
    })

    chainAssign(visitor, {
      CallExpression: function () {
        executionOrder.push('second')
      }
    })

    visitor.CallExpression({})

    expect(executionOrder).toEqual(['first'])
    expect(executionOrder).not.toContain('second')
  })

  it('should handle multiple compositions correctly', function () {
    const visitor = {}
    const executionOrder = []

    // 三次合并
    chainAssign(visitor, {
      CallExpression: () => executionOrder.push('first')
    })

    chainAssign(visitor, {
      CallExpression: () => executionOrder.push('second')
    })

    chainAssign(visitor, {
      CallExpression: () => executionOrder.push('third')
    })

    visitor.CallExpression({})

    expect(executionOrder).toEqual(['first', 'second', 'third'])
  })

  it('should preserve this context', function () {
    const visitor = {}
    const context = { name: 'test-context' }
    let capturedThis = null

    chainAssign(visitor, {
      CallExpression: function () {
        capturedThis = this
      }
    })

    visitor.CallExpression.call(context, {})

    expect(capturedThis).toBe(context)
  })

  it('should handle empty source object', function () {
    const visitor = {
      existing: () => 'original'
    }

    chainAssign(visitor, {})

    expect(visitor.existing()).toBe('original')
  })

  it('should handle empty target object', function () {
    const visitor = {}

    chainAssign(visitor, {
      newMethod: () => 'new'
    })

    expect(visitor.newMethod()).toBe('new')
  })
})

describe('WXS Pre-loader Visitor Merge', function () {
  describe('Object.assign 覆盖问题演示', function () {
    it('should demonstrate visitor method override issue with Object.assign', function () {
      const visitor = {}
      const executionLog = []
      const moduleWxs = true
      const mode = 'ali'

      // 模拟条件：module.wxs = true && mode = 'ali'
      if (moduleWxs && mode === 'ali') {
        Object.assign(visitor, {
          CallExpression: function (path) {
            executionLog.push('Ali模式: CallExpression处理')
          }
        })
      }

      // 模拟条件：module.wxs = true && mode !== 'wx'
      if (moduleWxs && mode !== 'wx') {
        Object.assign(visitor, {
          CallExpression: function (path) {
            executionLog.push('非wx模式: CallExpression处理')
          }
        })
      }

      // 执行visitor
      visitor.CallExpression()

      // 验证问题：只有最后一个处理器被执行
      expect(executionLog).toEqual(['非wx模式: CallExpression处理'])
      expect(executionLog).not.toContain('Ali模式: CallExpression处理')

      console.log('Object.assign 覆盖问题:', executionLog)
    })

    it('should demonstrate MemberExpression override in dd + non-wxs scenario', function () {
      const visitor = {}
      const executionLog = []
      const moduleWxs = false
      const mode = 'dd'

      // 模拟条件：mode = 'dd'
      if (mode === 'dd') {
        Object.assign(visitor, {
          MemberExpression: function (path) {
            executionLog.push('滴滴小程序模式: MemberExpression处理')
          }
        })
      }

      // 模拟条件：!module.wxs
      if (!moduleWxs) {
        Object.assign(visitor, {
          MemberExpression: function (path) {
            executionLog.push('非wxs模式: MemberExpression处理')
          }
        })
      }

      // 执行visitor
      visitor.MemberExpression()

      // 验证问题：DD模式的处理被完全覆盖
      expect(executionLog).toEqual(['非wxs模式: MemberExpression处理'])
      expect(executionLog).not.toContain('DD模式: MemberExpression处理')

      console.log('Object.assign 覆盖问题:', executionLog)
    })
  })

  describe('chainAssign 解决方案', function () {
    it('should safely merge CallExpression visitors without override', function () {
      const visitor = {}
      const executionLog = []
      const moduleWxs = true
      const mode = 'ali'

      // 模拟条件：module.wxs = true && mode = 'ali'
      if (moduleWxs && mode === 'ali') {
        chainAssign(visitor, {
          CallExpression: function (path) {
            executionLog.push('Ali模式: CallExpression处理')
          }
        })
      }

      // 模拟条件：module.wxs = true && mode !== 'wx'
      if (moduleWxs && mode !== 'wx') {
        chainAssign(visitor, {
          CallExpression: function (path) {
            executionLog.push('非wx模式: CallExpression处理')
          }
        })
      }

      // 执行visitor，传入mock的path对象
      visitor.CallExpression({})

      // 验证解决方案：两个处理器都被执行
      expect(executionLog).toEqual([
        'Ali模式: CallExpression处理',
        '非wx模式: CallExpression处理'
      ])

      console.log('chainAssign CallExpression 解决方案:', executionLog)
    })

    it('should safely merge MemberExpression visitors without override', function () {
      const visitor = {}
      const executionLog = []
      const moduleWxs = false
      const mode = 'dd'

      // 模拟条件：mode = 'dd'
      if (mode === 'dd') {
        chainAssign(visitor, {
          MemberExpression: function (path) {
            executionLog.push('DD模式: MemberExpression处理')
          }
        })
      }

      // 模拟条件：!module.wxs
      if (!moduleWxs) {
        chainAssign(visitor, {
          MemberExpression: function (path) {
            executionLog.push('非wxs模式: MemberExpression处理')
          }
        })
      }

      // 执行visitor，传入mock的path对象
      visitor.MemberExpression({})

      // 验证解决方案：两个处理器都被执行
      expect(executionLog).toEqual([
        'DD模式: MemberExpression处理',
        '非wxs模式: MemberExpression处理'
      ])

      console.log('chainAssign MemberExpression 解决方案:', executionLog)
    })

    it('should respect path state and skip second visitor when path is stopped', function () {
      const visitor = {}
      const executionLog = []

      chainAssign(visitor, {
        CallExpression: function (path) {
          executionLog.push('第一个处理器')
          path.shouldStop = true // 第一个处理器设置停止标志
        }
      })

      chainAssign(visitor, {
        CallExpression: function (path) {
          executionLog.push('第二个处理器')
        }
      })

      // 执行visitor
      visitor.CallExpression({})

      // 验证：第二个处理器被跳过
      expect(executionLog).toEqual(['第一个处理器'])
      expect(executionLog).not.toContain('第二个处理器')

      console.log('状态感知测试:', executionLog)
    })

    it('should respect path state and skip second visitor when path is removed', function () {
      const visitor = {}
      const executionLog = []

      chainAssign(visitor, {
        MemberExpression: function (path) {
          executionLog.push('第一个处理器')
          path.removed = true // 第一个处理器标记节点已移除
        }
      })

      chainAssign(visitor, {
        MemberExpression: function (path) {
          executionLog.push('第二个处理器')
        }
      })

      // 执行visitor
      visitor.MemberExpression({})

      // 验证：第二个处理器被跳过
      expect(executionLog).toEqual(['第一个处理器'])
      expect(executionLog).not.toContain('第二个处理器')

      console.log('节点移除状态测试:', executionLog)
    })
  })

  describe('真实场景模拟', function () {
    it('should handle complex multi-platform scenario correctly', function () {
      const scenarios = [
        {
          name: '支付宝小程序WXS',
          config: { moduleWxs: true, mode: 'ali' },
          expectedConflicts: ['CallExpression']
        },
        {
          name: '滴滴小程序普通JS',
          config: { moduleWxs: false, mode: 'dd' },
          expectedConflicts: ['MemberExpression']
        },
        {
          name: '头条小程序WXS',
          config: { moduleWxs: true, mode: 'tt' },
          expectedConflicts: ['CallExpression']
        },
        {
          name: '微信小程序WXS',
          config: { moduleWxs: true, mode: 'wx' },
          expectedConflicts: [] // 微信模式没有冲突
        }
      ]

      scenarios.forEach(scenario => {
        console.log(`\n测试场景: ${scenario.name}`)
        const { moduleWxs, mode } = scenario.config

        // 模拟原始的Object.assign方式
        const oldVisitor = {}
        const newVisitor = {}

        // 应用所有条件
        if (moduleWxs) {
          if (mode === 'ali') {
            Object.assign(oldVisitor, { CallExpression: () => 'ali' })
            chainAssign(newVisitor, { CallExpression: () => 'ali' })
          }

          if (mode !== 'wx') {
            Object.assign(oldVisitor, { CallExpression: () => 'non-wx' })
            chainAssign(newVisitor, { CallExpression: () => 'non-wx' })
          }
        }

        if (mode === 'dd') {
          Object.assign(oldVisitor, { MemberExpression: () => 'dd' })
          chainAssign(newVisitor, { MemberExpression: () => 'dd' })
        }

        if (!moduleWxs) {
          Object.assign(oldVisitor, { MemberExpression: () => 'non-wxs' })
          chainAssign(newVisitor, { MemberExpression: () => 'non-wxs' })
        }

        // 验证是否有冲突
        const hasConflicts = scenario.expectedConflicts.length > 0

        if (hasConflicts) {
          // 验证Object.assign确实有覆盖问题
          expect(Object.keys(oldVisitor)).toEqual(Object.keys(newVisitor))
          console.log(`检测到预期的冲突: ${scenario.expectedConflicts.join(', ')}`)
        } else {
          console.log('无冲突场景，两种方式结果一致')
        }
      })
    })
  })
})
