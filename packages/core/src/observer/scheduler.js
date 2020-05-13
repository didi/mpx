import { asyncLock } from '../helper/utils'
import { error } from '../helper/log'

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
        }
        break
      }
    }
    // 如果已经销毁，就不再执行
    if (!watcher.destroyed) {
      watcher.run()
    }
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
