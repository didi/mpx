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
function addHooks (result, visitor) {
  if (typeof visitor === 'function') {
    // 函数形式的 visitor 只作为 enter 钩子
    result.enter.push(visitor)
  } else {
    // 处理 enter 钩子
    if (visitor.enter) {
      if (Array.isArray(visitor.enter)) {
        result.enter.push(...visitor.enter)
      } else {
        result.enter.push(visitor.enter)
      }
    }
    // 处理 exit 钩子
    if (visitor.exit) {
      if (Array.isArray(visitor.exit)) {
        result.exit.push(...visitor.exit)
      } else {
        result.exit.push(visitor.exit)
      }
    }
  }
}

module.exports = function mergeVisitors (target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (!target[key]) {
      target[key] = value
    } else {
      const result = { enter: [], exit: [] }
      // 合并现有值和新值
      addHooks(result, target[key])
      addHooks(result, value)
      if (result.exit.length === 0) {
        delete result.exit
      }
      target[key] = result
    }
  }

  return target
}
