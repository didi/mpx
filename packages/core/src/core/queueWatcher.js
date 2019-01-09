const queue = []
const idsMap = {}
let waiting = false
let flushing = false
let curIndex = 0
export default function queueWatcher (watcher) {
  if (!idsMap[watcher.id]) {
    idsMap[watcher.id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      let i = queue.length - 1
      while (i > curIndex && watcher.id < queue[i].id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    if (!waiting) {
      waiting = true
      Promise.resolve().then(() => {
        flushQueue()
      }).catch(e => {
        console.error(e)
      })
    }
  }
}

function flushQueue () {
  flushing = true
  queue.sort((a, b) => {
    if (a.id > b.id) {
      return 1
    } else {
      return -1
    }
  })
  for (curIndex = 0; curIndex < queue.length; curIndex++) {
    const watcher = queue[curIndex]
    idsMap[watcher.id] = null
    // 如果已经销毁，就不再执行
    watcher.destroyed || watcher.run()
  }
  resetQueue()
}

function resetQueue () {
  flushing = waiting = false
  curIndex = queue.length = 0
}
