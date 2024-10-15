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
        refs.forEach(({ key, type, all }) => {
          this.__selectorMap[key] = this.__selectorMap[key] || []
          this.__selectorMap[key].push({ key, type })
          Object.defineProperty(this.$refs, key, {
            enumerable: true,
            configurable: true,
            get () {
              const refs = target.__refs[key] || []
              if (type === 'component') {
                return all ? refs : refs[0]
              } else {
                return createSelectorQuery().in(target).select(key, all)
              }
            }
          })
        })
      },
      __getRefVal (key) {
        return (instance) => {
          if (instance) {
            this.__refs[key] = this.__refs[key] || []
            this.__refs[key].push(instance)
          }
        }
      },
      __selectRef (selector, refType, all = false) {
        const splitedSelector = selector.match(/(#|\.)?[^.#]+/g) || []
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
