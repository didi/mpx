import { setByPath, collectDataset } from '../../helper/utils'
import { error } from '../../helper/log'

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
      if (target.dataset && target.dataset.cancelbubble) {
        $event.stopPropagation && $event.stopPropagation()
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
            // 暂不支持$event.xxx的写法
            // if (/^\$event/.test(item)) {
            //   this.__mpxTempEvent = $event
            //   const value = getByPath(this, item.replace('$event', '__mpxTempEvent'))
            //   // 删除临时变量
            //   delete this.__mpxTempEvent
            //   return value
            if (item === '__mpx_event__') {
              return $event
            } else {
              return item
            }
          }) : [$event]
          if (typeof this[callbackName] === 'function') {
            returnedValue = this[callbackName].apply(this, params)
          } else {
            const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
            error(`Instance property [${callbackName}] is not function, please check.`, location)
          }
        }
      })
      return returnedValue
    },
    __model (expr, $event, valuePath = ['value'], filterMethod) {
      const innerFilter = {
        trim: val => typeof val === 'string' && val.trim()
      }
      let originValue
      if (__mpx_mode__ === 'qa') {
        originValue = valuePath.reduce((acc, cur) => acc[cur], $event)
      } else {
        originValue = valuePath.reduce((acc, cur) => acc[cur], $event.detail)
      }
      const value = filterMethod ? (innerFilter[filterMethod] ? innerFilter[filterMethod](originValue) : typeof this[filterMethod] === 'function' && this[filterMethod]) : originValue
      setByPath(this, expr, value)
    }
  }
  if (__mpx_mode__ === 'ali') {
    Object.assign(methods, {
      triggerEvent (eventName, eventDetail) {
        const handlerName = eventName.replace(/^./, matched => matched.toUpperCase()).replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())
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
