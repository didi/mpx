import { setByPath } from '@mpxjs/utils'

export default function proxyEventMixin () {
  return {
    beforeCreate () {
      const modelEvent = this.$attrs.mpxModelEvent
      if (modelEvent) {
        this.$on(modelEvent, (e) => {
          this.$emit('mpxModel', e)
        })
      }
    },
    methods: {
      __model (expr, $event, valuePath = ['value'], filterMethod) {
        const innerFilter = {
          trim: val => typeof val === 'string' && val.trim()
        }
        const originValue = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
        const value = filterMethod ? (innerFilter[filterMethod] ? innerFilter[filterMethod](originValue) : typeof this[filterMethod] === 'function' && this[filterMethod]) : originValue
        setByPath(this, expr, value)
      },
      getOpenerEventChannel () {
        const router = global.__mpxRouter
        const eventChannel = router && router.__mpxAction && router.__mpxAction.eventChannel
        return eventChannel
      }
    }
  }
}
