import flatten from 'lodash/flatten.js'

const mixinsQueueMap = {
  app: [[], []],
  page: [[], []],
  component: [[], []]
}

export function clearInjectMixins () {
  mixinsQueueMap.app = [[], []]
  mixinsQueueMap.page = [[], []]
  mixinsQueueMap.component = [[], []]
}

export function injectMixins (mixins, options = {}) {
  if (typeof options === 'string' || Array.isArray(options)) {
    options = {
      types: options
    }
  }

  let types = options.types || ['page', 'component']
  const stage = options.stage || -1

  if (typeof types === 'string') {
    types = [types]
  }

  if (!Array.isArray(mixins)) {
    mixins = [mixins]
  }

  mixins.stage = stage

  types.forEach(type => {
    const mixinsQueue = stage < 0 ? mixinsQueueMap[type][0] : mixinsQueueMap[type][1]
    for (let i = 0; i <= mixinsQueue.length; i++) {
      if (i === mixinsQueue.length) {
        mixinsQueue.push(mixins)
        break
      }
      const item = mixinsQueue[i]
      if (mixins === item) break
      if (stage < item.stage) {
        mixinsQueue.splice(i, 0, mixins)
        break
      }
    }
  })

  return this
}

export function mergeInjectedMixins (options, type) {
  const before = flatten(mixinsQueueMap[type][0])
  const middle = options.mixins || []
  const after = flatten(mixinsQueueMap[type][1])
  const mixins = before.concat(middle).concat(after)
  if (mixins.length) {
    options.mixins = mixins
  }
  return options
}
