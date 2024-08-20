import { BEFORECREATE } from '../../core/innerLifecycle'
import { createSelectorQuery } from '@mpxjs/api-proxy'

export default function getRefsMixin () {
  return {
    [BEFORECREATE] () {
      this.__refs = {}
      this.$refs = {}
      this.__selectorMap = {}
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        const refs = this.__getRefsData() || []
        const target = this
        refs.forEach(({ key, type, all, refKey, selector }) => {
          selector.forEach(item => {
            this.__selectorMap[item] = this.__selectorMap[item] || []
            this.__selectorMap[item].push({ type, key })
          })
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
        const splitedSelector = selector.match(/(#|\.)\w+/g) || []
        const refsArr = splitedSelector.map(selector => {
          const selectorMap = this.__selectorMap[selector] || []
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
