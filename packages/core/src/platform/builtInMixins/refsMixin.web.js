import { BEFOREMOUNT, UPDATED } from '../../core/innerLifecycle'
import { createSelectorQuery } from '@mpxjs/api-proxy'

function getEl (ref) {
  if (ref && ref.nodeType === 1) return ref
  if (ref && ref.$options && ref.$options.__mpxBuiltIn) return ref.$el
}

function processRefs (refs) {
  Object.keys(refs).forEach((key) => {
    const matched = /^__mpx_ref_(.+)__$/.exec(key)
    const rKey = matched && matched[1]
    if (rKey) {
      const ref = refs[key]
      if (Array.isArray(ref)) {
        if (getEl(ref[0])) {
          refs[rKey] = createSelectorQuery().in(this).selectAll(ref.map(getEl))
        } else {
          refs[rKey] = ref
        }
      } else {
        if (getEl(ref)) {
          refs[rKey] = createSelectorQuery().in(this).select(getEl(ref))
        } else {
          refs[rKey] = ref
        }
      }
    }
  })
}

export default function getRefsMixin () {
  return {
    [BEFOREMOUNT] () {
      processRefs(this.$refs || {})
    },
    [UPDATED] () {
      processRefs(this.$refs || {})
    }
  }
}
