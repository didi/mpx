let action
function collectionData (type, value) {
  const animates = action.animates
  if (!animates.length) {
    // 如果没有直接push进数组里
    animates.push(trimAnimationData(type, value))
    return
  }
  for (let i = 0; i < animates.length; i++) {
    if (animates[i]?.type === 'style' && animates[i]?.args[0] === type) {
      animates[i] = trimAnimationData(type, value)
      return
    }
  }
  animates.push(trimAnimationData(type, value))
}

function trimAnimationData (type, value) {
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
class Animation {
  constructor (options) {
    action = {
      animates: [],
      option: options
    }
    this.actions = []
  }

  right (value) {
    collectionData('right', value)
    return this
  }

  left (value) {
    collectionData('left', value)
    return this
  }

  top (value) {
    collectionData('top', value)
    return this
  }

  bottom (value) {
    collectionData('bottom', value)
    return this
  }

  width (value) {
    collectionData('width', value)
    return this
  }

  height (value) {
    collectionData('height', value)
    return this
  }

  opacity (value) {
    collectionData('opacity', value)
    return this
  }

  backgroundColor (color) {
    collectionData('background-color', color)
    return this
  }

  matrix (...value) {
    collectionData('matrix', value)
    return this
  }

  matrix3d (...value) {
    const defaultVal = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    defaultVal.splice(0, value.length, ...value)
    collectionData('matrix3d', defaultVal)
    return this
  }

  rotate (...value) {
    collectionData('rotate', `${parseFloat(value)}deg`)
    return this
  }

  rotate3d (...value) {
    const defaultVal = [0, 0, 0, 0]
    defaultVal.splice(0, value.length, ...value)
    defaultVal[3] = `${parseFloat(defaultVal[3])}deg` // 手动调整第四位为字符串类型并拼接单位
    collectionData('rotate3d', defaultVal)
    return this
  }

  rotateX (value) {
    collectionData('rotateX', `${parseFloat(value)}deg`)
    return this
  }

  rotateY (value) {
    collectionData('rotateY', `${parseFloat(value)}deg`)
    return this
  }

  rotateZ (value) {
    collectionData('rotateZ', `${parseFloat(value)}deg`)
    return this
  }

  scale (...value) {
    const [x, y = x] = value
    collectionData('scale', [x, y])
    return this
  }

  scale3d (...value) {
    const defaultVal = [1, 1, 1]
    defaultVal.splice(0, value.length, ...value)
    collectionData('scale3d', defaultVal)
    return this
  }

  scaleX (value) {
    collectionData('scaleX', value)
    return this
  }

  scaleY (value) {
    collectionData('scaleY', value)
    return this
  }

  scaleZ (value) {
    collectionData('scaleZ', value)
    return this
  }

  skew (...value) {
    const [x = 0, y = 0] = value
    collectionData('skew', [`${parseFloat(x)}deg`, `${parseFloat(y)}deg`])
    return this
  }

  skewX (value) {
    collectionData('skewX', `${parseFloat(value)}deg`)
    return this
  }

  skewY (value) {
    collectionData('skewY', `${parseFloat(value)}deg`)
    return this
  }

  translate (...value) {
    const [x = 0, y = 0] = value
    collectionData('translate', [`${parseFloat(x)}px`, `${parseFloat(y)}px`])
    return this
  }

  translate3d (...value) {
    const [x = 0, y = 0, z = 0] = value
    collectionData('translate3d', [`${parseFloat(x)}px`, `${parseFloat(y)}px`, `${parseFloat(z)}px`])
    return this
  }

  translateX (value) {
    collectionData('translateX', `${parseFloat(value)}px`)
    return this
  }

  translateY (value) {
    collectionData('translateY', `${parseFloat(value)}px`)
    return this
  }

  translateZ (value) {
    collectionData('translateZ', `${parseFloat(value)}px`)
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
    return this
  }

  export () {
    const actions = this.actions.slice(0)
    this.actions.length = 0
    return {
      actions
    }
  }
}

export default Animation
