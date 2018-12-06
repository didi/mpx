import { getByPath } from '../../helper/utils'
export default function proxyEventMixin (mixinType) {
  return {
    methods: {
      __invoke ($event) {
        const type = $event.type
        let fallbackType = ''
        // if (type === 'begin' || type === 'end') {
        //   // 地图的 regionchange 事件会派发 e.type 为 begin 和 end 的事件
        //   fallbackType = 'regionchange'
        // }
        const target = $event.currentTarget || $event.target
        const bindConfigs = target.dataset.__bindconfigs || {}
        const curEventConfig = bindConfigs[type] || bindConfigs[fallbackType] || []
        if (!curEventConfig.length) return
        const callbackName = curEventConfig[0]
        const params = curEventConfig.length > 1 ? curEventConfig.slice(1).map(item => {
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
      },
      __model (expr, $event) {
        expr = expr.replace(/\[/g, '.').replace(/[\]'"]/g, '')
        const lastIndex = expr.lastIndexOf('.')
        let path = ''
        let varible = ''
        if (lastIndex > -1) {
          path = expr.slice(0, lastIndex)
          varible = expr.slice(lastIndex + 1)
        } else {
          varible = expr
        }
        try {
          getByPath(this, path)[varible] = $event.detail.value
        } catch (e) {
        }
      }
    }
  }
}
