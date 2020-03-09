import { asyncLock } from '../helper/utils'

const queue = []
let has = {}
let flushing = false
let curIndex = 0
const lockTask = asyncLock()

export function queueWatcher (watcher) {
  if (!watcher.id && typeof watcher === 'function') {
    watcher = {
      id: Infinity,
      run: watcher
    }
  }
  if (!has[watcher.id] || watcher.id === Infinity) {
    has[watcher.id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      let i = queue.length - 1
      while (i > curIndex && watcher.id < queue[i].id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    lockTask(flushQueue, resetQueue)
  }
}

function flushQueue () {
  flushing = true
  queue.sort((a, b) => a.id - b.id)
  for (curIndex = 0; curIndex < queue.length; curIndex++) {
    const watcher = queue[curIndex]
    delete has[watcher.id]
    // 如果已经销毁，就不再执行
    if (!watcher.destroyed) watcher.run()
  }
  resetQueue()
}

function resetQueue () {
  flushing = false
  curIndex = queue.length = 0
  has = {}
}
