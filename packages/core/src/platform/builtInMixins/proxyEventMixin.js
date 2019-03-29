import { is } from '../../helper/env'
import { collectDataset, setByPath } from '../../helper/utils'

export default function proxyEventMixin () {
  const methods = {
    __invoke ($event) {
      const type = $event.type
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
        if (callbackName) {
          const params = item.length > 1 ? item.slice(1).map(item => {
            if (item === '$event') {
              return $event
            } else {
              return item
            }
          }) : [$event]
          if (typeof this[callbackName] === 'function') {
            returnedValue = this[callbackName].apply(this, params)
          } else {
            console.warn(`[${callbackName}] is not function`)
          }
        }
      })
      return returnedValue
    },
    __model (expr, $event, valuePath = ['value']) {
      const value = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
      setByPath(this, expr, value)
    }
  }
  if (is('ali')) {
    Object.assign(methods, {
      triggerEvent (eventName, eventDetail) {
        const handlerName = eventName.replace(/^./, matched => matched.toUpperCase())
        const handler = this['on' + handlerName] || this['catch' + handlerName]
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
