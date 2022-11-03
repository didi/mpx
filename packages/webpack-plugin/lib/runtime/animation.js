module.exports = function (el, binding) {
  const newActions = binding && binding.value && binding.value.actions
  if (el.actions === newActions) {
    Promise.resolve().then(() => {
      Object.assign(el.style, el.lastDynamicStyle)
    })
    return
  }
  el.actions = newActions
  if (typeof el.setAnimation === 'function') {
    el.removeEventListener('transitionend', el.setAnimation, false)
    el.setAnimation = undefined
  }
  el.dynamicStyleQueue = []
  el.lastDynamicStyle = undefined
  if (Array.isArray(newActions) && newActions.length) {
    newActions.forEach((item) => {
      const property = []
      const { animates, option } = item
      // 存储动画需要改变的样式属性
      const dynamicStyle = {
        transform: ''
      }
      animates.forEach((itemAnimation) => {
        switch (itemAnimation.type) {
          case 'style': {
            const [key, value] = itemAnimation.args
            dynamicStyle[key] = value
            property.push(key)
            break
          }
          default:
            dynamicStyle.transform += `${itemAnimation.type}(${itemAnimation.args}) `
            if (!property.includes('transform')) {
              property.push('transform')
            }
        }
      })
      Object.assign(dynamicStyle, {
        transition: `${parseInt(option.duration)}ms ${option.timingFunction} ${parseInt(option.delay)}ms`,
        transitionProperty: `${property}`,
        transformOrigin: option.transformOrigin
      })
      el.dynamicStyleQueue.push(dynamicStyle)
    })
    el.setAnimation = function () {
      if (!el.dynamicStyleQueue.length) {
        el.removeEventListener('transitionend', el.setAnimation, false)
        return
      }
      const dynamicStyle = el.dynamicStyleQueue.shift()
      Object.assign(el.style, dynamicStyle)
      el.lastDynamicStyle = dynamicStyle
    }
    // 首次动画属性设置
    setTimeout(el.setAnimation, 0)
    // 在transitionend事件内设置动画样式
    el.addEventListener('transitionend', el.setAnimation, false)
  }
}
