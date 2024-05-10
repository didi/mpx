import { BEFORECREATE } from '../../core/innerLifecycle'

export default function getRefsMixin () {
  return {
    [BEFORECREATE] () {
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
              return all ? target.__refs.current[key] : target.__refs.current[key][0]
            }
          })
        })
      },
      __getRefVal (key) {
        if (!this.__refs.current[key]) {
          this.__refs.current[key] = []
        }
        return (instance) => this.__refs.current[key].push(instance)
      }
    }
  }
}
