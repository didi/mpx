class Animation {
  constructor (options) {
    this._actions = []
    this._propMaps = {}
    this._options = options
  }

  _collectData (type, value) {
    switch (type) {
      case 'background-color':
      case 'opacity':
        this._propMaps[type] = {
          value,
          type: 'style'
        }
        break
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
      case 'width':
      case 'height':
        if (typeof value === 'number') {
          value = `${value}px`
        }
        this._propMaps[type] = {
          value,
          type: 'style'
        }
        break
      default:
        this._propMaps[type] = {
          value,
          type
        }
        break
    }
  }

  right (value) {
    this._collectData('right', value)
    return this
  }

  left (value) {
    this._collectData('left', value)
    return this
  }

  top (value) {
    this._collectData('top', value)
    return this
  }

  bottom (value) {
    this._collectData('bottom', value)
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
    this._collectData('background-color', color)
    return this
  }

  matrix (...value) {
    this._collectData('matrix', value)
    return this
  }

  matrix3d (...value) {
    const defaultVal = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    defaultVal.splice(0, value.length, ...value)
    this._collectData('matrix3d', defaultVal)
    return this
  }

  rotate (...value) {
    this._collectData('rotate', `${parseFloat(value)}deg`)
    return this
  }

  rotate3d (...value) {
    const defaultVal = [0, 0, 0, 0]
    defaultVal.splice(0, value.length, ...value)
    defaultVal[3] = `${parseFloat(defaultVal[3])}deg` // 手动调整第四位为字符串类型并拼接单位
    this._collectData('rotate3d', defaultVal)
    return this
  }

  rotateX (value) {
    this._collectData('rotateX', `${parseFloat(value)}deg`)
    return this
  }

  rotateY (value) {
    this._collectData('rotateY', `${parseFloat(value)}deg`)
    return this
  }

  rotateZ (value) {
    this._collectData('rotateZ', `${parseFloat(value)}deg`)
    return this
  }

  scale (...value) {
    const [x, y = x] = value
    this._collectData('scale', [x, y])
    return this
  }

  scale3d (...value) {
    const defaultVal = [1, 1, 1]
    defaultVal.splice(0, value.length, ...value)
    this._collectData('scale3d', defaultVal)
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

  scaleZ (value) {
    this._collectData('scaleZ', value)
    return this
  }

  skew (...value) {
    const [x = 0, y = 0] = value
    this._collectData('skew', [`${parseFloat(x)}deg`, `${parseFloat(y)}deg`])
    return this
  }

  skewX (value) {
    this._collectData('skewX', `${parseFloat(value)}deg`)
    return this
  }

  skewY (value) {
    this._collectData('skewY', `${parseFloat(value)}deg`)
    return this
  }

  translate (...value) {
    const [x = 0, y = 0] = value
    this._collectData('translate', [`${parseFloat(x)}px`, `${parseFloat(y)}px`])
    return this
  }

  translate3d (...value) {
    const [x = 0, y = 0, z = 0] = value
    this._collectData('translate3d', [`${parseFloat(x)}px`, `${parseFloat(y)}px`, `${parseFloat(z)}px`])
    return this
  }

  translateX (value) {
    this._collectData('translateX', `${parseFloat(value)}px`)
    return this
  }

  translateY (value) {
    this._collectData('translateY', `${parseFloat(value)}px`)
    return this
  }

  translateZ (value) {
    this._collectData('translateZ', `${parseFloat(value)}px`)
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
    for (let i in this._propMaps) {
      const {value, type} = this._propMaps[i]
      animates.push({
        args: type === 'style' ? [i, value] : Array.isArray(value) ? value : [value],
        type
      })
    }
    this._actions.push({
      animates,
      option
    })
    return this
  }

  export () {
    const actions = this._actions.slice(0)
    return {
      actions
    }
  }
}

export default Animation
