/**
 * 性能监控工具 - RN 组件创建性能分析
 */

// 获取高精度时间戳（微秒级）
function getHighResTime() {
  // 优先使用 performance.now()（精度到微秒）
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  // 降级到 Date.now()（精度到毫秒）
  return Date.now()
}

// 存储每个实例的性能数据
const instancePerformanceMap = new Map()

class PerformanceTimer {
  constructor(instanceId, name) {
    this.instanceId = instanceId
    this.name = name
    this.startTime = getHighResTime()
    this.checkpoints = []
  }

  checkpoint(name) {
    // 检查是否启用 checkpoint
    const config = getConfig()
    if (!config.enableCheckpoints) return

    const now = getHighResTime()
    const duration = now - this.startTime
    this.checkpoints.push({
      name,
      time: now,
      duration
    })
  }

  end() {
    const totalDuration = getHighResTime() - this.startTime
    return {
      instanceId: this.instanceId,
      name: this.name,
      totalDuration,
      checkpoints: this.checkpoints
    }
  }
}

function getConfig() {
  // 延迟加载 Mpx，避免循环依赖
  try {
    const Mpx = require('../index').default
    return {
      enabled: Mpx.config.enablePerformanceMonitor || false,
      logThreshold: Mpx.config.performanceLogThreshold || 0,
      enableCheckpoints: Mpx.config.enablePerformanceCheckpoints !== false, // 默认启用
      realtimeLog: Mpx.config.performanceRealtimeLog !== false // 默认启用实时日志
    }
  } catch (e) {
    return {
      enabled: false,
      logThreshold: 0,
      enableCheckpoints: true,
      realtimeLog: true
    }
  }
}

export function enablePerformanceMonitor(enabled = true, logThreshold = 0) {
  try {
    const Mpx = require('../index').default
    Mpx.config.enablePerformanceMonitor = enabled
    Mpx.config.performanceLogThreshold = logThreshold
  } catch (e) {
    console.warn('Failed to enable performance monitor:', e)
  }
}

export function isPerformanceMonitorEnabled() {
  return getConfig().enabled
}

export function startPerformanceTimer(instanceId, name) {
  const config = getConfig()
  if (!config.enabled) return null

  const timer = new PerformanceTimer(instanceId, name)

  if (!instancePerformanceMap.has(instanceId)) {
    instancePerformanceMap.set(instanceId, {
      timers: [],
      componentName: ''
    })
  }

  return timer
}

export function endPerformanceTimer(timer, componentName = '') {
  const config = getConfig()
  if (!timer || !config.enabled) return

  const result = timer.end()

  // 先存储数据，再判断是否输出日志
  const instanceData = instancePerformanceMap.get(result.instanceId)
  if (instanceData) {
    instanceData.timers.push(result)
    if (componentName) {
      instanceData.componentName = componentName
    }
  }

  // 只有启用实时日志且超过阈值才输出日志
  if (config.realtimeLog && result.totalDuration >= config.logThreshold) {
    const prefix = componentName ? `[${componentName}]` : ''
    console.log(`[MPX Performance] ${prefix} ${result.name}: ${result.totalDuration.toFixed(3)}ms`)

    if (result.checkpoints.length > 0) {
      console.log('  Checkpoints:')
      result.checkpoints.forEach((checkpoint, index) => {
        const prevTime = index > 0 ? result.checkpoints[index - 1].duration : 0
        const stepDuration = checkpoint.duration - prevTime
        console.log(`    - ${checkpoint.name}: ${checkpoint.duration.toFixed(3)}ms (+${stepDuration.toFixed(3)}ms)`)
      })
    }
  }
}

export function getInstancePerformanceData(instanceId) {
  return instancePerformanceMap.get(instanceId)
}

export function clearInstancePerformanceData(instanceId) {
  instancePerformanceMap.delete(instanceId)
}

export function clearAllPerformanceData() {
  instancePerformanceMap.clear()
}

export function getPerformanceSummary() {
  const summary = {
    totalInstances: instancePerformanceMap.size,
    instances: []
  }

  instancePerformanceMap.forEach((data, instanceId) => {
    const timers = data.timers
    const totalTime = timers.reduce((sum, timer) => sum + timer.totalDuration, 0)

    summary.instances.push({
      instanceId,
      componentName: data.componentName,
      totalTime,
      timers: timers.map(t => ({
        name: t.name,
        duration: t.totalDuration,
        checkpoints: t.checkpoints // 保留完整的 checkpoints 数据
      }))
    })
  })

  return summary
}

/**
 * 打印格式化的性能报告
 */
export function printPerformanceReport(options = {}) {
  const {
    minTime = 0, // 最小耗时阈值（ms）
    sortBy = 'totalTime', // 排序方式: totalTime | componentName
    limit = 20 // 显示数量限制
  } = options

  const summary = getPerformanceSummary()

  if (summary.totalInstances === 0) {
    console.log('[MPX Performance] 暂无性能数据')
    return
  }

  let instances = summary.instances.filter(item => item.totalTime >= minTime)

  // 排序
  if (sortBy === 'totalTime') {
    instances.sort((a, b) => b.totalTime - a.totalTime)
  } else if (sortBy === 'componentName') {
    instances.sort((a, b) => (a.componentName || '').localeCompare(b.componentName || ''))
  }

  // 限制数量
  instances = instances.slice(0, limit)

  console.log('\n========== MPX 组件性能报告 ==========')
  console.log(`总组件数: ${summary.totalInstances}`)
  console.log(`平均耗时: ${(summary.instances.reduce((sum, item) => sum + item.totalTime, 0) / summary.totalInstances).toFixed(3)}ms`)
  console.log(`显示数量: ${instances.length} (耗时 >= ${minTime}ms)\n`)

  if (instances.length > 0) {
    // 检查是否支持 console.table (React Native 不支持)
    if (typeof console.table === 'function') {
      // 格式化表格数据
      const tableData = instances.map(item => {
        const breakdown = {}
        item.timers.forEach(timer => {
          timer.checkpoints.forEach((cp, idx) => {
            const stepTime = idx > 0 ? cp.duration - timer.checkpoints[idx - 1].duration : cp.duration
            breakdown[cp.name] = `${stepTime.toFixed(3)}ms`
          })
        })

        return {
          ID: item.instanceId,
          组件名: item.componentName || '-',
          总耗时: `${item.totalTime.toFixed(3)}ms`,
          计时器数: item.timers.length,
          ...breakdown
        }
      })

      console.table(tableData)
    } else {
      // RN 环境使用普通日志格式
      instances.forEach((item, index) => {
        console.log(`\n[${index + 1}] ${item.componentName || '未命名'} (ID: ${item.instanceId})`)
        console.log(`  总耗时: ${item.totalTime.toFixed(3)}ms`)

        if (item.timers && Array.isArray(item.timers)) {
          item.timers.forEach(timer => {
            if (timer.checkpoints && Array.isArray(timer.checkpoints) && timer.checkpoints.length > 0) {
              console.log(`  ${timer.name}:`)
              timer.checkpoints.forEach((cp, idx) => {
                const stepTime = idx > 0 ? cp.duration - timer.checkpoints[idx - 1].duration : cp.duration
                console.log(`    - ${cp.name}: ${stepTime.toFixed(3)}ms (累计 ${cp.duration.toFixed(3)}ms)`)
              })
            } else {
              console.log(`  ${timer.name}: ${timer.duration.toFixed(3)}ms`)
            }
          })
        }
      })
    }
  }

  console.log('======================================\n')

  return instances
}

/**
 * 打印简化的性能统计（更适合 RN 环境）
 */
export function printPerformanceStats(options = {}) {
  const { minTime = 0 } = options
  const summary = getPerformanceSummary()

  if (summary.totalInstances === 0) {
    console.log('[MPX Performance] 暂无性能数据')
    return
  }

  const instances = summary.instances.filter(item => item.totalTime >= minTime)
  const sortedInstances = instances.sort((a, b) => b.totalTime - a.totalTime)

  // 计算统计数据
  const totalTime = instances.reduce((sum, item) => sum + item.totalTime, 0)
  const avgTime = totalTime / instances.length

  // 耗时分布
  const distribution = {
    fast: instances.filter(i => i.totalTime < 1).length, // < 1ms
    normal: instances.filter(i => i.totalTime >= 1 && i.totalTime < 5).length, // 1-5ms
    slow: instances.filter(i => i.totalTime >= 5 && i.totalTime < 10).length, // 5-10ms
    verySlow: instances.filter(i => i.totalTime >= 10).length // >= 10ms
  }

  console.log('\n========== MPX 组件性能统计 ==========')
  console.log(`总组件数: ${summary.totalInstances}`)
  console.log(`累计耗时: ${totalTime.toFixed(3)}ms`)
  console.log(`平均耗时: ${avgTime.toFixed(3)}ms`)
  console.log('\n耗时分布:')
  console.log(`  < 1ms:     ${distribution.fast} 个`)
  console.log(`  1-5ms:     ${distribution.normal} 个`)
  console.log(`  5-10ms:    ${distribution.slow} 个`)
  console.log(`  >= 10ms:   ${distribution.verySlow} 个`)

  if (sortedInstances.length > 0) {
    console.log('\n最慢的 10 个组件:')
    sortedInstances.slice(0, 10).forEach((item, idx) => {
      const name = item.componentName || `#${item.instanceId}`
      console.log(`  ${idx + 1}. ${name}: ${item.totalTime.toFixed(3)}ms`)
    })
  }

  console.log('======================================\n')

  return {
    totalInstances: summary.totalInstances,
    totalTime,
    avgTime,
    distribution,
    slowest: sortedInstances.slice(0, 10)
  }
}

/**
 * 打印所有组件的详细性能数据（包括 checkpoints）
 * 适合在测试结束后批量查看每个组件的详细耗时
 */
export function printDetailedPerformanceData(options = {}) {
  const { minTime = 0, batchSize = 10 } = options
  const summary = getPerformanceSummary()

  if (summary.totalInstances === 0) {
    console.log('[MPX Performance] 暂无性能数据')
    return
  }

  const instances = summary.instances
    .filter(item => item.totalTime >= minTime)
    .sort((a, b) => b.totalTime - a.totalTime)

  console.log('\n========== MPX 组件详细性能数据 ==========')
  console.log(`总组件数: ${summary.totalInstances}`)
  console.log(`显示组件数: ${instances.length}`)
  console.log('==========================================\n')

  // 分批输出，避免日志被截断
  for (let i = 0; i < instances.length; i += batchSize) {
    const batch = instances.slice(i, Math.min(i + batchSize, instances.length))

    console.log(`\n--- 第 ${i + 1}-${i + batch.length} 个组件 ---\n`)

    batch.forEach((item, batchIdx) => {
      const globalIdx = i + batchIdx + 1
      const name = item.componentName || `component#${item.instanceId}`

      console.log(`[${globalIdx}] ${name}`)
      console.log(`  总耗时: ${item.totalTime.toFixed(3)}ms`)
      console.log(`  组件ID: ${item.instanceId}`)

      // 显示每个 timer 的详细信息
      if (item.timers && item.timers.length > 0) {
        item.timers.forEach(timer => {
          console.log(`\n  📊 ${timer.name}: ${timer.duration.toFixed(3)}ms`)

          // 显示 checkpoints
          if (timer.checkpoints && timer.checkpoints.length > 0) {
            console.log('    详细步骤:')
            timer.checkpoints.forEach((cp, idx) => {
              const prevDuration = idx > 0 ? timer.checkpoints[idx - 1].duration : 0
              const stepTime = cp.duration - prevDuration
              console.log(`      ${idx + 1}. ${cp.name}`)
              console.log(`         步骤耗时: ${stepTime.toFixed(3)}ms`)
              console.log(`         累计耗时: ${cp.duration.toFixed(3)}ms`)
            })
          }
        })
      }

      console.log('  ' + '─'.repeat(50))
    })

    // 每批之间稍微停顿，让日志输出完整
    if (i + batchSize < instances.length) {
      console.log('\n... 继续下一批 ...\n')
    }
  }

  console.log('\n========================================')
  console.log('所有组件详细数据输出完成')
  console.log('========================================\n')

  // ========== 汇总统计 ==========
  console.log('\n========== 累加耗时统计 ==========\n')

  // 1. 总体统计
  const totalTime = instances.reduce((sum, item) => sum + item.totalTime, 0)
  const avgTime = totalTime / instances.length
  const maxComponentTime = Math.max(...instances.map(i => i.totalTime))
  const minComponentTime = Math.min(...instances.map(i => i.totalTime))

  console.log('📊 总体统计:')
  console.log(`  总组件数: ${instances.length}`)
  console.log(`  累计总耗时: ${totalTime.toFixed(3)}ms`)
  console.log(`  平均耗时: ${avgTime.toFixed(3)}ms`)
  console.log(`  最大耗时: ${maxComponentTime.toFixed(3)}ms`)
  console.log(`  最小耗时: ${minComponentTime.toFixed(3)}ms`)

  // 2. 各个 Timer 的累加统计
  const timerStats = {}
  instances.forEach(item => {
    item.timers?.forEach(timer => {
      if (!timerStats[timer.name]) {
        timerStats[timer.name] = {
          total: 0,
          count: 0,
          max: 0,
          min: Infinity
        }
      }
      timerStats[timer.name].total += timer.duration
      timerStats[timer.name].count++
      timerStats[timer.name].max = Math.max(timerStats[timer.name].max, timer.duration)
      timerStats[timer.name].min = Math.min(timerStats[timer.name].min, timer.duration)
    })
  })

  console.log('\n📊 各计时器累加耗时:')
  Object.entries(timerStats)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([name, stats]) => {
      const avg = stats.total / stats.count
      console.log(`\n  ${name}:`)
      console.log(`    累计耗时: ${stats.total.toFixed(3)}ms`)
      console.log(`    平均耗时: ${avg.toFixed(3)}ms`)
      console.log(`    最大耗时: ${stats.max.toFixed(3)}ms`)
      console.log(`    最小耗时: ${stats.min.toFixed(3)}ms`)
      console.log(`    调用次数: ${stats.count}`)
    })

  // 3. 各个 Checkpoint 步骤的累加统计
  const checkpointStats = {}
  instances.forEach(item => {
    item.timers?.forEach(timer => {
      timer.checkpoints?.forEach((cp, idx) => {
        const prevDuration = idx > 0 ? timer.checkpoints[idx - 1].duration : 0
        const stepTime = cp.duration - prevDuration

        if (!checkpointStats[cp.name]) {
          checkpointStats[cp.name] = {
            total: 0,
            count: 0,
            max: 0,
            min: Infinity,
            samples: []
          }
        }

        checkpointStats[cp.name].total += stepTime
        checkpointStats[cp.name].count++
        checkpointStats[cp.name].max = Math.max(checkpointStats[cp.name].max, stepTime)
        checkpointStats[cp.name].min = Math.min(checkpointStats[cp.name].min, stepTime)
        checkpointStats[cp.name].samples.push(stepTime)
      })
    })
  })

  console.log('\n📊 各步骤累加耗时 (按累计耗时排序):')
  const sortedCheckpoints = Object.entries(checkpointStats)
    .map(([name, stats]) => ({
      name,
      avg: stats.total / stats.count,
      ...stats
    }))
    .sort((a, b) => b.total - a.total)

  sortedCheckpoints.forEach((item, idx) => {
    // 计算标准差
    const variance = item.samples.reduce((sum, val) =>
      sum + Math.pow(val - item.avg, 2), 0
    ) / item.samples.length
    const stdDev = Math.sqrt(variance)

    console.log(`\n  ${idx + 1}. ${item.name}`)
    console.log(`     累计耗时: ${item.total.toFixed(3)}ms (占比 ${(item.total / totalTime * 100).toFixed(1)}%)`)
    console.log(`     平均耗时: ${item.avg.toFixed(3)}ms`)
    console.log(`     最大耗时: ${item.max.toFixed(3)}ms`)
    console.log(`     最小耗时: ${item.min.toFixed(3)}ms`)
    console.log(`     标准差: ${stdDev.toFixed(3)}ms`)
    console.log(`     调用次数: ${item.count}`)
  })

  // 4. 性能瓶颈分析
  console.log('\n🔥 性能瓶颈分析:')
  const top5Bottlenecks = sortedCheckpoints.slice(0, 5)
  console.log('\n  最耗时的 5 个步骤:')
  top5Bottlenecks.forEach((item, idx) => {
    const percentage = (item.total / totalTime * 100).toFixed(1)
    console.log(`    ${idx + 1}. ${item.name}: ${item.total.toFixed(3)}ms (${percentage}%)`)
  })

  // 5. 优化建议
  console.log('\n💡 优化建议:')
  if (top5Bottlenecks.length > 0) {
    const topBottleneck = top5Bottlenecks[0]
    const percentage = (topBottleneck.total / totalTime * 100).toFixed(1)

    if (percentage > 30) {
      console.log(`  ⚠️  "${topBottleneck.name}" 占总耗时的 ${percentage}%，建议重点优化！`)
    }

    if (topBottleneck.max / topBottleneck.avg > 3) {
      console.log(`  ⚠️  "${topBottleneck.name}" 存在性能波动（最大耗时是平均值的 ${(topBottleneck.max / topBottleneck.avg).toFixed(1)} 倍）`)
    }
  }

  const avgComponentTime = totalTime / instances.length
  if (avgComponentTime > 1) {
    console.log(`  ⚠️  平均组件耗时 ${avgComponentTime.toFixed(3)}ms 偏高，建议优化组件初始化逻辑`)
  } else {
    console.log(`  ✅  平均组件耗时 ${avgComponentTime.toFixed(3)}ms 表现良好`)
  }

  console.log('\n========================================')
  console.log('累加统计分析完成')
  console.log('========================================\n')

  return instances
}
