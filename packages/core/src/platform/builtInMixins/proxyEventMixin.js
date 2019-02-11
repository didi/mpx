import getByPath from '../../helper/getByPath'

export default function proxyEventMixin () {
  return {
    methods: {
      __invoke ($event) {
        const type = $event.type
        let fallbackType = ''
        if (type === 'begin' || type === 'end') {
          // 地图的 regionchange 事件会派发 e.type 为 begin 和 end 的事件
          fallbackType = 'regionchange'
        }
        const target = $event.currentTarget || $event.target
        const bindConfigs = target.dataset.__bindconfigs || {}
        const curEventConfig = bindConfigs[type] || bindConfigs[fallbackType] || []
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
              this[callbackName].apply(this, params)
            } else {
              console.warn(`[${callbackName}] is not function`)
            }
          }
        })
      },
      __model (expr, $event) {
        let parent
        let variable
        getByPath(this, expr, (value, key, end) => {
          if (end) {
            parent = value
            variable = key
          }
          return value[key]
        })
        if (parent) {
          parent[variable] = $event.detail.value
        }
      }
    }
  }
}
