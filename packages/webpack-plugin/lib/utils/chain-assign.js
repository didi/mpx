/**
 * 链式合并方法的工具函数
 *
 * 在多条件分支下使用 Object.assign 会导致同名方法被覆盖，
 * 这个函数通过创建组合函数来确保所有方法都能按顺序执行。
 *
 * @param {Object} target - 目标 visitor 对象
 * @param {Object} source - 要链式分配的 visitor 方法对象
 *
 * @example
 * const visitor = {}
 *
 * // 第一次合并
 * chainAssign(visitor, {
 *   CallExpression(path) {
 *     console.log('第一个处理器')
 *   }
 * })
 *
 * // 第二次合并 - 不会覆盖，而是组合执行
 * chainAssign(visitor, {
 *   CallExpression(path) {
 *     console.log('第二个处理器')
 *   }
 * })
 *
 * // 执行时会依次输出:
 * // 第一个处理器
 * // 第二个处理器
 */
module.exports = function chainAssign (target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key]) {
      // 如果已存在同名方法，创建组合函数依次执行
      const originalMethod = target[key]
      target[key] = function (path) {
        originalMethod.call(this, path)
        // 只有当节点没有停止遍历或被移除时才继续执行
        if (!path.removed && !path.shouldStop) {
          value.call(this, path)
        }
      }
    } else {
      target[key] = value
    }
  }
}
