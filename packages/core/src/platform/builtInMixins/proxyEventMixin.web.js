import { setByPath } from '../../helper/utils'

export default function proxyEventMixin () {
  const methods = {
    triggerEvent (eventName, eventDetail) {
      return this.$emit(eventName, {
        type: eventName,
        detail: eventDetail
      })
    },
    __model (expr, $event, valuePath = ['value'], filterMethod) {
      const innerFilter = {
        trim: val => typeof val === 'string' && val.trim()
      }
      const originValue = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
      const value = filterMethod ? (innerFilter[filterMethod] ? innerFilter[filterMethod](originValue) : typeof this[filterMethod] === 'function' && this[filterMethod]) : originValue
      setByPath(this, expr, value)
    }
  }

  return {
    methods
  }
}
