import { CREATED } from '../../core/innerLifecycle'
import { createSelectorQuery } from '@mpxjs/api-proxy'
import { computed } from '../../observer/computed'

export default function getRefsMixin () {
  return {
    // 强依赖 CREATED 生命周期，确保响应式数据初始化完成
    [CREATED] () {
      this.__refs = {}
      this.$refs = {}
      this.__selectorMap = null
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        const refs = this.__getRefsData() || []
        const target = this
        this.__selectorMap = computed(() => {
          const selectorMap = {}
          refs.forEach(({ key, type, refKey, computedSelectorKeys = [] }) => {
            if (refKey) {
              selectorMap[refKey] = selectorMap[refKey] || []
              selectorMap[refKey].push({ type, key })
            }
            computedSelectorKeys.forEach((item = {}) => {
              const computedKey = item.key
              const prefix = item.prefix
              const selectors = this[computedKey] || ''
              selectors.trim().split(/\s+/).forEach(item => {
                const selector = prefix + item
                selectorMap[selector] = selectorMap[selector] || []
                selectorMap[selector].push({ type, key })
              })
            })
          })
          return selectorMap
        })
        refs.forEach(({ key, type, all, refKey }) => {
          if (refKey) {
            Object.defineProperty(this.$refs, refKey, {
              enumerable: true,
              configurable: true,
              get () {
                const refs = target.__refs[key] || []
                if (type === 'component') {
                  return all ? refs : refs[0]
                } else {
                  return createSelectorQuery().in(target).select(refKey, all)
                }
              }
            })
          }
        })
      },
      __getRefVal (key) {
        if (!this.__refs[key]) {
          this.__refs[key] = []
        }
        return (instance) => instance && this.__refs[key].push(instance)
      },
      __selectRef (selector, refType, all = false) {
        const splitedSelector = selector.match(/(#|\.)?\w+/g) || []
        const refsArr = splitedSelector.map(selector => {
          const selectorMap = this.__selectorMap.value[selector] || []
          const res = []
          selectorMap.forEach(({ type, key }) => {
            if (type === refType) {
              const _refs = this.__refs[key] || []
              res.push(..._refs)
            }
          })
          return res
        })

        const refs = refsArr.reduce((preRefs, curRefs, curIndex) => {
          if (curIndex === 0) return curRefs
          curRefs = new Set(curRefs)
          return preRefs.filter(p => curRefs.has(p))
        }, [])

        return all ? refs : refs[0]
      }
    }
  }
}
