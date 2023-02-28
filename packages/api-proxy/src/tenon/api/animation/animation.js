import { warn } from '../../../common/js'
class Animation {
  constructor (options) {
    this._actions = []
    this._propMaps = {}
    this._options = options
  }

  // 处理size
  _processSize (size) {
    if (typeof size === 'number') {
      return `${size}hm`
    } else {
      return size
    }
  }

  _collectData (type, value) {
    this._propMaps[type] = {
      type: type,
      value: value
    }
  }

  // 不支持
  right (value) {
    warn('不支持right方法')
    return this
  }

  // 不支持
  left (value) {
    warn('不支持left方法')
    return this
  }

  // 不支持
  top (value) {
    warn('不支持top方法')
    return this
  }

  // 不支持
  bottom (value) {
    warn('不支持bottom方法')
    return this
  }

  width (value) {
    this._collectData('width', value)
    return this
  }

  height (value) {
    this._collectData('height', value)
    return this
  }

  opacity (value) {
    this._collectData('opacity', parseFloat(value))
    return this
  }

  backgroundColor (color) {
    this._collectData('backgroundColor', color)
    return this
  }

  // 不支持
  matrix (...value) {
    warn('不支持matrix方法')
    return this
  }

  // 不支持
  matrix3d (...value) {
    warn('不支持matrix3d方法')
    return this
  }

  // 不支持
  rotate (...value) {
    warn('不支持rotate方法')
    return this
  }

  // 不支持
  rotate3d (...value) {
    warn('不支持rotate3d方法')
    return this
  }

  rotateX (value) {
    this._collectData('rotationX', `${parseFloat(value)}deg`)
    return this
  }

  rotateY (value) {
    this._collectData('rotationY', `${parseFloat(value)}deg`)
    return this
  }

  rotateZ (value) {
    this._collectData('rotationZ', `${parseFloat(value)}deg`)
    return this
  }

  scale (...value) {
    const [x, y = x] = value
    this._collectData('scaleX', x)
    this._collectData('scaleY', y)
    return this
  }

  // 不支持
  scale3d (...value) {
    warn('不支持scale3d方法')
    return this
  }

  scaleX (value) {
    this._collectData('scaleX', value)
    return this
  }

  scaleY (value) {
    this._collectData('scaleY', value)
    return this
  }

  // 不支持
  scaleZ (value) {
    warn('不支持scaleZ方法')
    return this
  }

  // 不支持
  skew (...value) {
    warn('不支持skew方法')
    return this
  }

  // 不支持
  skewX (value) {
    warn('不支持skewX方法')
    return this
  }

  // 不支持
  skewY (value) {
    warn('不支持skewY方法')
    return this
  }

  translate (...value) {
    const [x = 0, y = 0] = value
    this._collectData('position', {
      x: `${parseFloat(x)}hm`,
      y: `${parseFloat(y)}hm`
    })
    return this
  }

  // 不支持
  translate3d (...value) {
    warn('不支持translate3d方法')
    return this
  }

  translateX (value) {
    this._collectData('position', { x: `${parseFloat(value)}hm`, y: 0 })
    return this
  }

  translateY (value) {
    this._collectData('position', { x: `${parseFloat(value)}hm`, y: 0 })
    return this
  }

  // 不支持
  translateZ (value) {
    warn('不支持tranlateZ方法')
    return this
  }

  step (opt) {
    const option = {}
    const animates = []
    if (opt) {
      Object.assign(option, this._options, opt)
    } else {
      Object.assign(option, this._options)
    }
    Object.keys(this._propMaps).forEach((item) => {
      animates.push(this._propMaps[item])
    })
    // action  
    this._actions.push({
      animates,
      option
    })
    return this
  }

  export () {
    const actions = this._actions.slice(0)
    this._actions.length = 0
    // 一个action就是一个step
    const steps = actions.map((v) => {
      const styles = {}
      v.animates.forEach(animate => {
        styles[animate.type] = animate.value
      })
      return {
        ...v.option,
        styles
      }
    })
    return {
      steps
    }
  }
}

export default Animation
