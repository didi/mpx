import { is } from '../../helper/env'
import { collectDataset, setByPath, getByPath } from '../../helper/utils'

export default function proxyEventMixin () {
  const methods = {
    __invoke ($event) {
      const type = $event.type
      const emitMode = $event.detail && $event.detail.mpxEmit
      if (!type) {
        throw new Error('Event object must have [type] property!')
      }
      let fallbackType = ''
      if (type === 'begin' || type === 'end') {
        // 地图的 regionchange 事件会派发 e.type 为 begin 和 end 的事件
        fallbackType = 'regionchange'
      }
      const target = $event.currentTarget || $event.target
      if (!target) {
        throw new Error(`[${type}] event object must have [currentTarget/target] property!`)
      }
      const eventConfigs = target.dataset.eventconfigs || {}
      const curEventConfig = eventConfigs[type] || eventConfigs[fallbackType] || []
      let returnedValue
      curEventConfig.forEach((item) => {
        const callbackName = item[0]
        if (emitMode) {
          $event = $event.detail.data
        }
        if (callbackName) {
          const params = item.length > 1 ? item.slice(1).map(item => {
            if (/^\$event/.test(item)) {
              this.__mpxTempEvent = $event
              const value = getByPath(this, item.replace('$event', '__mpxTempEvent'))
              // 删除临时变量
              delete this.__mpxTempEvent
              return value
            } else {
              return item
            }
          }) : [$event]
          if (typeof this[callbackName] === 'function') {
            returnedValue = this[callbackName].apply(this, params)
          } else {
            process.env.NODE_ENV !== 'production' && console.warn('【MPX ERROR】', `[${callbackName}] is not function`)
          }
        }
      })
      return returnedValue
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
  if (is('ali')) {
    Object.assign(methods, {
      triggerEvent (eventName, eventDetail) {
        const handlerName = eventName.replace(/^./, matched => matched.toUpperCase())
        const handler = this.props && (this.props['on' + handlerName] || this.props['catch' + handlerName])
        if (handler && typeof handler === 'function') {
          const dataset = collectDataset(this.props)
          const id = this.props.id || ''
          const timeStamp = +new Date()
          const eventObj = {
            type: eventName,
            timeStamp,
            target: {
              id,
              dataset,
              targetDataset: dataset
            },
            currentTarget: {
              id,
              dataset
            },
            detail: eventDetail
          }
          handler.call(this, eventObj)
        }
      }
    })
  }
  return {
    methods
  }
}
