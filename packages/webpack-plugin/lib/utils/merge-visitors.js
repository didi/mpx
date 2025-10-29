/**
 * 链式合并方法的工具函数
 *
 * 在多条件分支下使用 Object.assign 会导致同名方法被覆盖，
 * 这个函数通过创建组合函数来确保所有方法都能按顺序执行。
 *
 * @param {Object} target - 目标 visitor 对象
 * @param {Object} source - 要链式分配的 visitor 方法对象
 **/

// 辅助函数：将 visitor 的所有钩子添加到结果中
function mergeVisitorHooks (result, visitor) {
  result.enter = result.enter.concat(visitor.enter)
  result.exit = result.exit.concat(visitor.exit)
  return result
}

function normalizeVisitor(visitor) {
  if (Array.isArray(visitor.exit) && Array.isArray(visitor.exit)) {
    return visitor
  }
  if (typeof visitor === 'function') {
    return { enter: [visitor], exit: [] }
  }

  if (visitor.enter) {
    if (!Array.isArray(visitor.enter)) {
      visitor.enter = [visitor.enter]
    }
  } else {
    visitor.enter = []
  }

  if (visitor.exit) {
    if (!Array.isArray(visitor.exit)) {
      visitor.exit = [visitor.exit]
    }
  } else {
    visitor.exit = []
  }
  return visitor
}

module.exports = function mergeVisitors (target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (!target[key]) {
      target[key] = normalizeVisitor(value)
    } else {
      // 合并现有值和新值
      target[key] = mergeVisitorHooks(normalizeVisitor(target[key]), normalizeVisitor(value))
    }
  }

  return target
}
