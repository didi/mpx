import { PAGE_HOOKS } from '../lifecycle'
export default function componentMixin (mixinType) {
  if (mixinType === 'component') {
    return {
      created () {
        const rawOptions = this.$rawOptions
        PAGE_HOOKS.forEach(key => {
          if (typeof rawOptions[key] === 'function') {
            // 使用createComponent创建page时，页面的事件直接写在options里是不生效的，必须注入到this上
            this[key] = rawOptions[key]
          }
        })
      }
    }
  }
}
