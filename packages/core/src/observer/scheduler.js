import { warn, isArray, callWithErrorHandling, isDev } from '@mpxjs/utils'
import Mpx from '../index'

let isFlushing = false
let isFlushPending = false

const queue = []
let flushIndex = 0

const pendingPostFlushCbs = []
let activePostFlushCbs = null
let postFlushIndex = 0

const resolvedPromise = Promise.resolve()
let currentFlushPromise = null

const RECURSION_LIMIT = 100

const getId = (job) => job.id == null ? Infinity : job.id

const comparator = (a, b) => {
  const diff = getId(a) - getId(b)
  if (diff === 0) {
    if (a.pre && !b.pre) return -1
    if (b.pre && !a.pre) return 1
  }
  return diff
}

function findInsertionIndex (id) {
  // the start index should be `flushIndex + 1`
  let start = flushIndex + 1
  let end = queue.length

  while (start < end) {
    const middle = (start + end) >>> 1
    const middleJob = queue[middle]
    const middleJobId = getId(middleJob)
    if (middleJobId < id || (middleJobId === id && middleJob.pre)) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return start
}

export function nextTick (fn) {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}

export function queuePostFlushCb (cb) {
  if (isArray(cb)) {
    pendingPostFlushCbs.push(...cb)
  } else if (
    !activePostFlushCbs ||
    !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)
  ) {
    pendingPostFlushCbs.push(cb)
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

export function hasPendingJob (job) {
  return queue.length && queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)
}

function queueFlush () {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    if (Mpx.config.forceFlushSync) {
      flushJobs()
    } else {
      currentFlushPromise = resolvedPromise.then(flushJobs)
    }
  }
}

export function flushPreFlushCbs (instance, seen) {
  if (isDev) seen = seen || new Map()
  for (let i = isFlushing ? flushIndex + 1 : 0; i < queue.length; i++) {
    const cb = queue[i]
    if (cb && cb.pre) {
      if (instance && cb.id !== instance.uid) continue
      if (isDev && checkRecursiveUpdates(seen, cb)) continue
      queue.splice(i, 1)
      i--
      cb()
    }
  }
}

export function flushPostFlushCbs (seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)]
    pendingPostFlushCbs.length = 0
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped)
      return
    }
    activePostFlushCbs = deduped
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
  }
}

function flushJobs (seen) {
  isFlushPending = false
  isFlushing = true

  if (isDev) seen = seen || new Map()

  queue.sort(comparator)

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job && job.active !== false) {
        if (isDev && checkRecursiveUpdates(seen, job)) continue
        callWithErrorHandling(job, null, 'scheduler')
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0

    flushPostFlushCbs(seen)

    isFlushing = false
    currentFlushPromise = null
    // some postFlushCb queued jobs!
    // keep flushing until it drains.
    if (queue.length || pendingPostFlushCbs.length) {
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
