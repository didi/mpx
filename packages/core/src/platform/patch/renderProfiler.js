import { RefKey } from '../../helper/const'
import { isRef, trackRefTrigger } from '../../observer/ref'

let renderProfilerId = 0

export const MAX_PENDING_RENDER_CAUSES = 100
export const MAX_RENDER_CAUSES = 20

const renderCauseKinds = new Set(['mount', 'reactive', 'force-update', 'unknown'])
const renderCauseSources = new Set(['props', 'data', 'setup', 'store', 'inject', 'unknown'])
const renderCauseOperations = new Set(['set', 'add', 'delete', 'array-mutation', 'trigger-ref'])

function hasOwnProperty (target, key) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

export function getPerformanceNow () {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

export function getUpdateToCommitDuration (updateScheduledAt, now = getPerformanceNow) {
  if (updateScheduledAt === null) return null
  return Math.max(0, now() - updateScheduledAt)
}

export function getChangedPropKeys (previousProps, currentProps) {
  if (!previousProps) return ['<mount>']
  const changedPropKeys = []
  const propKeys = new Set([
    ...Object.keys(previousProps),
    ...Object.keys(currentProps)
  ])
  propKeys.forEach((key) => {
    if (
      !Object.is(previousProps[key], currentProps[key]) ||
      !hasOwnProperty(previousProps, key) ||
      !hasOwnProperty(currentProps, key)
    ) {
      changedPropKeys.push(key)
    }
  })
  return changedPropKeys
}

function normalizeCauseString (value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'symbol') return value.description ? `Symbol(${value.description})` : 'Symbol'
}

function addSetupRefKeys (keys, setupRefKeys, ref) {
  const refKeys = ref && setupRefKeys && setupRefKeys.get(ref)
  if (refKeys) refKeys.forEach(key => keys.add(key))
}

function getSetupRefKeys (setupRefKeys, refs) {
  const keys = new Set()
  if (refs && typeof refs.forEach === 'function') {
    refs.forEach(ref => addSetupRefKeys(keys, setupRefKeys, ref))
  }
  return Array.from(keys).sort()
}

function joinSetupRefKeys (keys, rawKey) {
  if (!keys.length) return
  const suffix = normalizeCauseString(rawKey)
  return keys.map(key => suffix === undefined ? key : `${key}.${suffix}`).join('/')
}

export function normalizeRenderCause (info, setupRefKeys, computedTriggerRefs, refTriggerRefs) {
  if (!info || typeof info !== 'object') {
    return {
      kind: 'unknown',
      count: 1
    }
  }

  const rawKind = info.kind || (renderCauseOperations.has(info.type) ? 'reactive' : 'unknown')
  const kind = renderCauseKinds.has(rawKind) ? rawKind : 'unknown'
  const cause = {
    kind,
    count: 1
  }

  if (kind === 'reactive') {
    const rawOperation = info.operation || info.type
    const hasKnownRawSource = renderCauseSources.has(info.source) && info.source !== 'unknown'
    const hasKnownRawKey = info.key !== undefined && info.key !== RefKey
    const directSetupRefKeys = getSetupRefKeys(setupRefKeys, info.ref ? [info.ref] : undefined)
    let relatedSetupRefKeys = []
    if (!directSetupRefKeys.length && (!hasKnownRawSource || !hasKnownRawKey)) {
      relatedSetupRefKeys = getSetupRefKeys(setupRefKeys, refTriggerRefs)
      if (!relatedSetupRefKeys.length) {
        relatedSetupRefKeys = getSetupRefKeys(setupRefKeys, computedTriggerRefs)
      }
    }
    const setupRefKeysForCause = directSetupRefKeys.length
      ? directSetupRefKeys
      : relatedSetupRefKeys
    const setupRefKey = setupRefKeysForCause.length
      ? joinSetupRefKeys(
          setupRefKeysForCause,
          directSetupRefKeys.length || rawOperation === 'array-mutation' || info.key === RefKey
            ? undefined
            : info.key
        )
      : undefined
    cause.source = setupRefKey
      ? 'setup'
      : renderCauseSources.has(info.source) ? info.source : 'unknown'
    const operation = directSetupRefKeys.length || (info.key === RefKey && rawOperation === 'set')
      ? 'trigger-ref'
      : rawOperation
    if (renderCauseOperations.has(operation)) cause.operation = operation
    const key = setupRefKey || normalizeCauseString(info.key)
    const method = normalizeCauseString(info.method)
    if (key !== undefined && (operation !== 'trigger-ref' || setupRefKey)) cause.key = key
    if (method !== undefined) cause.method = method
  }

  return cause
}

function getRenderCauseKey (cause) {
  return [cause.kind, cause.source, cause.operation, cause.key, cause.method].join('|')
}

function limitRenderCauses (causes) {
  if (causes.length <= MAX_RENDER_CAUSES) return causes
  const visibleCauses = causes.slice(0, MAX_RENDER_CAUSES - 1)
  const hiddenCauseCount = causes.slice(MAX_RENDER_CAUSES - 1).reduce((total, cause) => total + cause.count, 0)
  const existingTruncatedCause = visibleCauses.find(cause => cause.kind === 'unknown' && cause.key === '<truncated>')
  if (existingTruncatedCause) {
    existingTruncatedCause.count += hiddenCauseCount
  } else {
    visibleCauses.push({
      kind: 'unknown',
      key: '<truncated>',
      count: hiddenCauseCount
    })
  }
  return visibleCauses
}

function aggregateRenderCauses (entries, overflowCount) {
  const causes = []
  const causeMap = new Map()

  if (overflowCount > 0) {
    causes.push({
      kind: 'unknown',
      key: '<truncated>',
      count: overflowCount
    })
  }

  entries.forEach((entry) => {
    const key = getRenderCauseKey(entry.cause)
    const existing = causeMap.get(key)
    if (existing) {
      existing.count += entry.cause.count
    } else {
      const cause = Object.assign({}, entry.cause)
      causeMap.set(key, cause)
      causes.push(cause)
    }
  })

  return limitRenderCauses(causes)
}

export function createRenderCauseState () {
  return {
    nextCauseId: 0,
    pendingCauses: [],
    pendingOverflow: null,
    hasCommittedTemplate: false,
    setupRefKeys: new WeakMap()
  }
}

export function registerSetupRenderProfilerRefs (state, setupResult) {
  Object.keys(setupResult).forEach((key) => {
    const ref = setupResult[key]
    if (!isRef(ref)) return
    let keys = state.setupRefKeys.get(ref)
    if (!keys) {
      keys = new Set()
      state.setupRefKeys.set(ref, keys)
      trackRefTrigger(ref)
    }
    keys.add(key)
  })
}

export function appendRenderCause (state, info, scheduledAt = getPerformanceNow(), computedTriggerRefs, refTriggerRefs) {
  const id = state.nextCauseId + 1
  state.nextCauseId = id
  state.pendingCauses.push({
    id,
    scheduledAt,
    cause: normalizeRenderCause(info, state.setupRefKeys, computedTriggerRefs, refTriggerRefs)
  })

  if (state.pendingCauses.length > MAX_PENDING_RENDER_CAUSES) {
    const dropped = state.pendingCauses.shift()
    if (state.pendingOverflow) {
      state.pendingOverflow.lastId = dropped.id
    } else {
      state.pendingOverflow = {
        firstId: dropped.id,
        lastId: dropped.id,
        firstScheduledAt: dropped.scheduledAt
      }
    }
  }
}

export function snapshotRenderCauses (state, isMount) {
  const maxCauseId = state.nextCauseId
  const entries = state.pendingCauses.filter(entry => entry.id <= maxCauseId)
  const overflow = state.pendingOverflow
  const overflowLastId = overflow ? Math.min(overflow.lastId, maxCauseId) : 0
  const overflowCount = overflow && overflow.firstId <= overflowLastId
    ? overflowLastId - overflow.firstId + 1
    : 0
  const updateCount = overflowCount + entries.reduce((total, entry) => total + entry.cause.count, 0)
  const firstEntry = entries[0]
  let causes

  if (isMount) {
    causes = [{ kind: 'mount', count: 1 }]
  } else {
    causes = aggregateRenderCauses(entries, overflowCount)
    if (!causes.length) causes = [{ kind: 'unknown', count: 1 }]
  }

  return {
    maxCauseId,
    causes,
    updateScheduledAt: overflowCount && overflow.firstScheduledAt != null
      ? overflow.firstScheduledAt
      : firstEntry ? firstEntry.scheduledAt : null,
    updateCount
  }
}

export function consumeRenderCauseSnapshot (state, snapshot) {
  if (!snapshot || !snapshot.maxCauseId) return
  const maxCauseId = snapshot.maxCauseId
  state.pendingCauses = state.pendingCauses.filter(entry => entry.id > maxCauseId)

  const overflow = state.pendingOverflow
  if (!overflow || overflow.firstId > maxCauseId) return
  if (overflow.lastId <= maxCauseId) {
    state.pendingOverflow = null
  } else {
    overflow.firstId = maxCauseId + 1
    overflow.firstScheduledAt = null
  }
}

export function commitRenderCauseSnapshot (state, snapshot, templateExecuted) {
  if (!templateExecuted || !snapshot) return
  consumeRenderCauseSnapshot(state, snapshot)
  state.hasCommittedTemplate = true
}

export function createRenderProfilerMeta (type, rawOptions, currentInject) {
  return {
    type,
    moduleId: currentInject.moduleId || '',
    componentPath: currentInject.componentPath || '',
    resource: rawOptions.mpxFileResource || currentInject.componentPath || currentInject.moduleId || ''
  }
}

export function resolveRenderProfiler (config, meta, onFilterError) {
  if (!config || !config.enabled || typeof config.onRender !== 'function') return null
  if (typeof config.shouldProfile === 'function') {
    try {
      if (!config.shouldProfile(meta)) return null
    } catch (e) {
      onFilterError && onFilterError(e)
      return null
    }
  }
  return {
    config,
    meta
  }
}

export function createRenderProfilerId (meta) {
  renderProfilerId += 1
  return `${meta.moduleId || meta.resource}:${renderProfilerId}`
}
