import { BEFORECREATE } from '../../core/innerLifecycle'
import { useRef } from 'react'

export default function getRefsMixin () {
  return {
    [BEFORECREATE] () {
      this.$refs = {}
      this.__refMap = {}
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData() || []
          const target = this
          refs.forEach(({ key, all }) => {
            Object.defineProperty(this.$refs, key, {
              enumerable: true,
              configurable: true,
              get () {
                return target.__refMap[key] && target.__refMap[key].current
              }
            })

            this.__refMap[key] = useRef(all ? [] : null)
          })
        }
      },
      __getRefVal (key, all) {
        const ref = this.__refMap[key]
        return all ? (instance) => ref.current.push(instance) : ref
      }
    }
  }
}
