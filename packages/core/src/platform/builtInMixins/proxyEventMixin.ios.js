import { error } from '@mpxjs/utils'
import Mpx from '../../index'

export default function proxyEventMixin () {
  const methods = {
    __invoke (rawEvent, type, eventConfig = []) {
      const eventObj = {
        type,
        detail: null,
        ...rawEvent.nativeEvent
      }
      if (typeof Mpx.config.proxyEventHandler === 'function') {
        try {
          Mpx.config.proxyEventHandler(eventObj)
        } catch (e) {
        }
      }
      const location = this.__mpxProxy.options.mpxFileResource

      let returnedValue
      eventConfig.forEach((item) => {
        const callbackName = item[0]
        if (callbackName) {
          const params = item.length > 1
            ? item.slice(1).map(item => {
              if (item === '__mpx_event__') {
                return eventObj
              } else {
                return item
              }
            })
            : [eventObj]
          if (typeof this[callbackName] === 'function') {
            returnedValue = this[callbackName].apply(this, params)
          } else {
            error(`Instance property [${callbackName}] is not function, please check.`, location)
          }
        }
      })
      return returnedValue
    }
    // __model (expr, $event, valuePath = ['value'], filterMethod) {
    //   const innerFilter = {
    //     trim: val => typeof val === 'string' && val.trim()
    //   }
    //   const originValue = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
    //   const value = filterMethod ? (innerFilter[filterMethod] ? innerFilter[filterMethod](originValue) : typeof this[filterMethod] === 'function' ? this[filterMethod](originValue) : originValue) : originValue
    //   setByPath(this, expr, value)
    // }
  }
  return {
    methods
  }
}
