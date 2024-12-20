import { setByPath, extend, parseDataset } from '@mpxjs/utils'

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
          trim: (val) => typeof val === 'string' && val.trim()
        }
        const originValue = valuePath.reduce(
          (acc, cur) => acc[cur],
          $event.detail
        )
        const value = filterMethod
          ? innerFilter[filterMethod]
            ? innerFilter[filterMethod](originValue)
            : typeof this[filterMethod] === 'function' && this[filterMethod]
          : originValue
        setByPath(this, expr, value)
      },
      __invokeHandler (eventName, $event) {
        const newEvent = extend({}, $event, {
          target: extend({}, $event.target, {
            dataset: parseDataset($event.target.dataset)
          }),
          currentTarget: extend({}, $event.currentTarget, {
            dataset: parseDataset($event.currentTarget.dataset)
          })
        })
        const handler = this[eventName]
        if (handler && typeof handler === 'function') {
          handler.call(this, newEvent)
        }
      }
    }
  }
}
