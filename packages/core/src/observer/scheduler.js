import { warn } from '../helper/log'
import EXPORT_MPX from '../index'
import { isDev } from '../helper/env'
import { callWithErrorHandling } from '../helper/errorHandling'
import { currentInstance } from '../core/proxy'
import { isArray } from '../helper/utils'

let isFlushing = false
let isFlushPending = false

const queue = []
let flushIndex = 0

const pendingPreFlushCbs = []
let activePreFlushCbs = null
let preFlushIndex = 0

const pendingPostFlushCbs = []
let activePostFlushCbs = null
let postFlushIndex = 0

const resolvedPromise = Promise.resolve()

const RECURSION_LIMIT = 100

const getId = (job) => job.id == null ? Infinity : job.id

function findInsertionIndex (id) {
  // the start index should be `flushIndex + 1`
  let start = flushIndex + 1
  let end = queue.length

  while (start < end) {
    const middle = (start + end) >>> 1
    const middleJobId = getId(queue[middle])
    middleJobId < id ? (start = middle + 1) : (end = middle)
  }

  return start
}

export function nextTick (fn, instance = currentInstance) {
  const p = new Promise((resolve) => queuePostFlushCb(resolve)).then(() => instance?.currentRenderTask?.promise)
  return fn ? p.then(fn) : p
}

export function queuePreFlushCb (cb) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex)
}

export function queuePostFlushCb (cb) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex)
}

function queueRenderTask (cb, instance) {
  const renderTask = instance.flushingRenderTask || instance.currentRenderTask
  if (renderTask && renderTask.state !== 'finished') {
    renderTask.queueCb(cb)
    return true
  }
  return false
}

export function queuePostRenderEffect (cb, instance) {
  if (instance) {
    if (!queueRenderTask(cb, instance)) {
      queuePostFlushCb(() => {
        if (!queueRenderTask(cb, instance)) queuePostFlushCb(cb)
      })
    }
  } else {
    queuePostFlushCb(cb)
  }
}

function queueCb (cb, activeQueue, pendingQueue, index) {
  if (isArray(cb)) {
    pendingQueue.push(...cb)
  } else if (
    !activeQueue ||
    !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)
  ) {
    pendingQueue.push(cb)
  }
  queueFlush()
}

export function queueJob (job) {
  // the dedupe search uses the startIndex argument of Array.includes()
  // by default the search index includes the current job that is being run
  // so it cannot recursively trigger itself again.
  // if the job is a watch() callback, the search will start with a +1 index to
  // allow it recursively trigger itself - it is the user's responsibility to
  // ensure it doesn't end up in an infinite loop.
  if (
    !queue.length ||
    !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}

function queueFlush () {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    if (EXPORT_MPX.config.forceFlushSync) {
      flushJobs()
    } else {
      resolvedPromise.then(flushJobs)
    }
  }
}

export function flushPreFlushCbs (seen) {
  if (pendingPreFlushCbs.length) {
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
    pendingPreFlushCbs.length = 0
    if (isDev) seen = seen || new Map()
    for (
      preFlushIndex = 0;
      preFlushIndex < activePreFlushCbs.length;
      preFlushIndex++
    ) {
      if (isDev && checkRecursiveUpdates(seen, activePreFlushCbs[preFlushIndex])) continue
      activePreFlushCbs[preFlushIndex]()
    }
    activePreFlushCbs = null
    preFlushIndex = 0
    // recursively flush until it drains
    flushPreFlushCbs(seen)
  }
}

export function flushPostFlushCbs (seen) {
  if (pendingPostFlushCbs.length) {
    activePostFlushCbs = [...new Set(pendingPostFlushCbs)]
    pendingPostFlushCbs.length = 0
    if (isDev) seen = seen || new Map()

    // activePostFlushCbs.sort((a, b) => getId(a) - getId(b))
    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      if (isDev && checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex])) continue
      activePostFlushCbs[postFlushIndex]()
    }
    activePostFlushCbs = null
    postFlushIndex = 0
    // recursively flush until it drains
    flushPostFlushCbs(seen)
  }
}

function flushJobs (seen) {
  isFlushPending = false
  isFlushing = true

  if (isDev) seen = seen || new Map()

  flushPreFlushCbs(seen)

  queue.sort((a, b) => getId(a) - getId(b))

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        if (isDev && checkRecursiveUpdates(seen, job)) continue
        callWithErrorHandling(job, null, 'render job')
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    flushPostFlushCbs(seen)

    isFlushing = false
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (
      queue.length ||
      pendingPreFlushCbs.length ||
      pendingPostFlushCbs.length
    ) {
      flushJobs(seen)
    }
  }
}

function checkRecursiveUpdates (seen, fn) {
  if (!seen.has(fn)) {
    seen.set(fn, 1)
  } else {
    const count = seen.get(fn)
    if (count > RECURSION_LIMIT) {
      warn(
        'Maximum recursive updates exceeded.\n' +
        'This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself'
      )
      return true
    } else {
      seen.set(fn, count + 1)
    }
  }
}

export class RenderTask {
  state = 'pending'
  index = 0
  queue = []

  constructor (instance) {
    this.instance = instance
    instance.currentRenderTask = this
    this.promise = new Promise((resolve) => {
      this.resolve = (res) => {
        this.flush()
        resolve(res)
      }
    })
  }

  queueCb (cb) {
    if (this.state === 'finished') return
    if (
      !this.queue.length ||
      !this.queue.includes(cb, this.state === 'flushing' && cb.allowRecurse ? this.index + 1 : this.index)
    ) {
      this.queue.push(cb)
    }
  }

  flush (seen) {
    if (this.state === 'finished') return
    this.state = 'flushing'
    this.instance.flushingRenderTask = this

    if (isDev) seen = seen || new Map()

    for (; this.index < this.queue.length; this.index++) {
      const cb = this.queue[this.index]
      if (isDev && checkRecursiveUpdates(seen, cb)) continue
      cb()
    }
    this.instance.flushingRenderTask = null
    this.state = 'finished'
  }
}
