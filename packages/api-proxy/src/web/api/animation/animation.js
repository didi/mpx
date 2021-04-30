let action
class Animation {
  constructor (options) {
    action = {
      animates: [],
      option: options
    }
    this.actions = []
  }

  _collectionData (type, value) {
    const animates = action.animates
    if (!animates.length) { //如果没有直接push进数组里
      animates.push(this._trimAnimationData(type, value))
      return
    }
    for (let i = 0; i < animates.length; i++) {
      if (animates[i]?.type === 'style' && animates[i]?.args[0] === type) {
        animates[i] = this._trimAnimationData(type, value)
        return
      }
    }
    animates.push(this._trimAnimationData(type, value))
  }

  _trimAnimationData (type, value) {
    let result
    switch (type) {
      case 'background-color':
      case 'opacity':
        result = {
          args: [type, value],
          type: 'style'
        }
        break
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
      case 'width':
      case 'height':
        result = {
          args: [type, `${parseFloat(value)}px`],
          type: 'style'
        }
        break
      default:
        result = {
          args: value,
          type
        }
        break
    }
    return result
  }

  right (value) {
    this._collectionData('right', value)
    return this
  }

  left (value) {
    this._collectionData('left', value)
    return this
  }

  top (value) {
    this._collectionData('top', value)
    return this
  }

  bottom (value) {
    this._collectionData('bottom', value)
    return this
  }

  width (value) {
    this._collectionData('width', value)
    return this
  }

  height (value) {
    this._collectionData('height', value)
    return this
  }

  opacity (value) {
    this._collectionData('opacity', value)
    return this
  }

  backgroundColor (color) {
    this._collectionData('background-color', color)
    return this
  }

  matrix (...value) {
    this._collectionData('matrix', value)
    return this
  }

  matrix3d (...value) {
    const defaultVal = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    defaultVal.splice(0, value.length, ...value)
    this._collectionData('matrix3d', defaultVal)
    return this
  }

  rotate (...value) {
    this._collectionData('rotate', `${parseFloat(value)}deg`)
    return this
  }

  rotate3d (...value) {
    const defaultVal = [0, 0, 0, 0]
    defaultVal.splice(0, value.length, ...value)
    defaultVal[3] = `${parseFloat(defaultVal[3])}deg` // 手动调整第四位为字符串类型并拼接单位
    this._collectionData('rotate3d', defaultVal)
    return this
  }

  rotateX (value) {
    this._collectionData('rotateX', `${parseFloat(value)}deg`)
    return this
  }

  rotateY (value) {
    this._collectionData('rotateY', `${parseFloat(value)}deg`)
    return this
  }

  rotateZ (value) {
    this._collectionData('rotateZ', `${parseFloat(value)}deg`)
    return this
  }

  scale (...value) {
    const [x, y = x] = value
    this._collectionData('scale', [x, y])
    return this
  }

  scale3d(...value) {
    const defaultVal = [1, 1, 1]
    defaultVal.splice(0, value.length, ...value)
    this._collectionData('scale3d', defaultVal)
    return this
  }

  scaleX (value) {
    this._collectionData('scaleX', value)
    return this
  }

  scaleY (value) {
    this._collectionData('scaleY', value)
    return this
  }

  scaleZ (value) {
    this._collectionData('scaleZ', value)
    return this
  }

  skew (...value) {
    const [x = 0, y = 0] = value
    this._collectionData('skew', [`${parseFloat(x)}deg`, `${parseFloat(y)}deg`])
    return this
  }

  skewX (value) {
    this._collectionData('skewX', `${parseFloat(value)}deg`)
    return this
  }

  skewY (value) {
    this._collectionData('skewY', `${parseFloat(value)}deg`)
    return this
  }

  translate (...value) {
    const [x = 0, y = 0] = value
    this._collectionData('translate', [`${parseFloat(x)}px`, `${parseFloat(y)}px`])
    return this
  }

  translate3d (...value) {
    const [x = 0, y = 0, z = 0] = value
    this._collectionData('translate3d', [`${parseFloat(x)}px`, `${parseFloat(y)}px`, `${parseFloat(z)}px`])
    return this
  }

  translateX (value) {
    this._collectionData('translateX', `${parseFloat(value)}px`)
    return this
  }

  translateY (value) {
    this._collectionData('translateY', `${parseFloat(value)}px`)
    return this
  }

  translateZ (value) {
    this._collectionData('translateZ', `${parseFloat(value)}px`)
    return this
  }

  step (opt) {
    if (opt) {
      Object.assign(action.option, opt)
    }
    this.actions.push({
      animates: [...action.animates],
      option: Object.assign({}, action.option)
    })
  }

  export () {
    return {
      actions: this.actions
    }
  }
}

export default Animation
