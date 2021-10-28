import { asyncLock } from '../helper/utils'
import { error } from '../helper/log'
import EXPORT_MPX from '../index'

const queue = []
let has = {}
let circular = {}
let flushing = false
let curIndex = 0
const lockTask = asyncLock()
const MAX_UPDATE_COUNT = 100

export function queueWatcher (watcher) {
  if (!watcher.id && typeof watcher === 'function') {
    watcher = {
      id: Infinity,
      run: watcher
    }
  }
  // 开启EXPORT_MPX.config.forceRunWatcherSync时，queueWatcher同步执行，便于调试排查问题
  if (EXPORT_MPX.config.forceRunWatcherSync) return watcher.run()
  if (!has[watcher.id] || watcher.id === Infinity) {
    has[watcher.id] = true
    if (!flushing) {
      queue.push(watcher)
      lockTask(flushQueue, resetQueue)
    } else {
      let i = queue.length - 1
      while (i > curIndex && watcher.id < queue[i].id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
  }
}

export function dequeueWatcher (watcher) {
  if (!watcher.id || !has[watcher.id]) return
  const index = queue.indexOf(watcher)
  if (index > -1) {
    queue.splice(index, 1)
    has[watcher.id] = false
  }
}

function flushQueue () {
  flushing = true
  queue.sort((a, b) => a.id - b.id)
  for (curIndex = 0; curIndex < queue.length; curIndex++) {
    const watcher = queue[curIndex]
    const id = watcher.id
    if (id !== Infinity) {
      delete has[id]
      if (process.env.NODE_ENV !== 'production') {
        circular[id] = (circular[id] || 0) + 1
        if (circular[id] > MAX_UPDATE_COUNT) {
          let location = watcher.vm && watcher.vm.options && watcher.vm.options.mpxFileResource
          error(`You may have a dead circular update in watcher with expression [${watcher.expression}], please check!`, location)
          break
        }
      }
    }
    watcher.run()
  }
  resetQueue()
}

function resetQueue () {
  flushing = false
  curIndex = queue.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
}
