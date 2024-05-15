import { BEFORECREATE } from '../../core/innerLifecycle'

export default function getRefsMixin () {
  return {
    [BEFORECREATE] () {
      this._$refs = {}
      this.$refs = {}
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        const refs = this.__getRefsData() || []
        const target = this
        refs.forEach(({ key, all }) => {
          Object.defineProperty(this.$refs, key, {
            enumerable: true,
            configurable: true,
            get () {
              return all ? target._$refs[key] : target._$refs[key][0]
            }
          })
        })
      },
      __getRefVal (key) {
        if (!this._$refs[key]) {
          this._$refs[key] = []
        }
        return (instance) => instance && this._$refs[key].push(instance)
      },
      __resetRefs () {
        this._$refs = {}
      }
    }
  }
}
