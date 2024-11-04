class Animation {
  constructor (
    {
      duration = 400,
      delay = 0,
      timingFunction = 'linear',
      transformOrigin = '50% 50% 0'
    } = {}
  ) {
    // 默认值
    this._setDefault(duration, delay, timingFunction, transformOrigin)
    this.id = 0
  }

  _transformUnit (...args) {
    return args.map(each => {
      return global.__formatValue(each)
    })
  }

  _formatTransformOrigin (transformOrigin) {
    const transformOriginArr = transformOrigin.trim().split(/\s+/, 3).map(item => global.__formatValue(item))
    switch (transformOriginArr.length) {
      case 0:
        transformOriginArr.push('50%', '50%', 0)
        break
      case 1:
        transformOriginArr.push('50%', 0)
        break
      case 2:
        transformOriginArr.push(0)
        break
    }
    return transformOriginArr
  }

  // 设置默认值
  _setDefault (duration, delay, timingFunction, transformOrigin) {
    this.DEFAULT = { duration, delay, timingFunction, transformOrigin }
  }

  // 属性组合
  rules = new Map()
  // transform 对象
  transform = new Map()
  // 组合动画
  steps = []

  matrix (a, b, c, d, tx, ty) { // Todo
    console.error('React Native 不支持 matrix 动画')
    // this.transform.set('matrix', [a, b, c, d, tx, ty])
    return this
  }

  matrix3d (a1, b1, c1, d1,
            a2, b2, c2, d2,
            a3, b3, c3, d3,
            a4, b4, c4, d4
  ) {
    console.error('React Native 不支持 matrix3d 动画')
    // this.transform.set('matrix3d', [ // Todo
    //   a1, b1, c1, d1,
    //   a2, b2, c2, d2,
    //   a3, b3, c3, d3,
    //   a4, b4, c4, d4
    // ])
    return this
  }

  rotate (angle) { // 旋转变换
    this.transform.set('rotate', `${angle}deg`)
    return this
  }

  rotate3d (x, y, z, angle) {
    if (typeof y !== 'number') {
      this.transform.set('rotate3d', x)
    } else {
      // this.transform.set('rotate3d', [x, y, z, angle])
      this.rotateX(x)
      this.rotateY(y)
      this.rotateZ(z)
      this.rotate(angle)
    }
    return this
  }

  rotateX (angle) {
    this.transform.set('rotateX', `${angle}deg`)
    return this
  }

  rotateY (angle) {
    this.transform.set('rotateY', `${angle}deg`)
    return this
  }

  rotateZ (angle) {
    this.transform.set('rotateZ', `${angle}deg`)
    return this
  }

  scale (x, y) {
    const scaleY = (typeof y !== 'undefined' && y !== null) ? y : x
    this.scaleX(x)
    this.scaleY(scaleY)
    // this.transform.set('scale', [x, scaleY])
    return this
  }

  scaleX (scale) {
    this.transform.set('scaleX', scale)
    return this
  }

  scaleY (scale) {
    this.transform.set('scaleY', scale)
    return this
  }

  scaleZ (scale) { // Todo Invariant Violation: Invalid transform scaleZ: {"scaleZ":0}
    console.error('React Native 不支持 transform scaleZ')
    // this.transform.set('scaleZ', scale)
    return this
  }

  scale3d (x, y, z) { // Todo Invariant Violation: Invalid transform scaleZ: {"scaleZ":0}
    console.error('React Native 不支持 transform scaleZ，故不支持 scale3d')
    // this.scaleX(x)
    // this.scaleY(y)
    // this.scaleZ(z)
    return this
  }

  skew (x, y) {
    // this.transform.set('skew', [x, y])
    this.skewX(x)
    this.skewY(y)
    return this
  }

  skewX (angle) {
    this.transform.set('skewX', `${angle}deg`)
    return this
  }

  skewY (angle) {
    this.transform.set('skewY', `${angle}deg`)
    return this
  }

  translate (x, y) {
    [x, y] = this._transformUnit(x, y)
    // this.transform.set('translate', [x, y])
    this.translateX(x)
    this.translateY(y)
    return this
  }

  translateX (translate) {
    [translate] = this._transformUnit(translate)
    this.transform.set('translateX', translate)
    return this
  }

  translateY (translate) {
    [translate] = this._transformUnit(translate)
    this.transform.set('translateY', translate)
    return this
  }

  translateZ (translate) { // Todo Invariant Violation: Invalid transform translateZ: {"translateZ":0}
    console.error('React Native 不支持 transform translateZ')
    // [translate] = this._transformUnit(translate)
    // this.transform.set('translateZ', translate)
    return this
  }

  translate3d (x, y, z) { // Todo Invariant Violation: Invalid transform translateZ: {"translateZ":0}
    console.error('React Native 不支持 transform translateZ，故无法支持 translate3d')
    // [x, y, z] = this._transformUnit(x, y, z)
    // // this.transform.set('translate3d', [x, y, z])
    // this.translateX(x)
    // this.translateY(y)
    // this.translateZ(z)
    return this
  }

  opacity (value) {
    this.rules.set('opacity', value)
    return this
  }

  backgroundColor (value) {
    this.rules.set('backgroundColor', value)
    return this
  }

  width (value) {
    [value] = this._transformUnit(value)
    this.rules.set('width', value)
    return this
  }

  height (value) {
    [value] = this._transformUnit(value)
    this.rules.set('height', value)
    return this
  }

  top (value) {
    [value] = this._transformUnit(value)
    this.rules.set('top', value)
    return this
  }

  right (value) {
    [value] = this._transformUnit(value)
    this.rules.set('right', value)
    return this
  }

  bottom (value) {
    [value] = this._transformUnit(value)
    this.rules.set('bottom', value)
    return this
  }

  left (value) {
    [value] = this._transformUnit(value)
    this.rules.set('left', value)
    return this
  }

  // 关键帧载入
  step (arg = {}) {
    const { DEFAULT } = this
    let {
      duration = DEFAULT.duration,
      delay = DEFAULT.delay,
      timingFunction = DEFAULT.timingFunction,
      transformOrigin = DEFAULT.transformOrigin
    } = arg
    if (typeof transformOrigin !== 'string') {
      console.error('Value of transformOrigin only support string type, please check again')
      transformOrigin = DEFAULT.transformOrigin
    }
    this.steps.push({
      animatedOption: {
        duration,
        delay,
        timingFunction,
        transformOrigin: this._formatTransformOrigin(transformOrigin)
      },
      rules: this.rules,
      transform: this.transform
    })
    // 清空 rules 和 transform
    this.rules = new Map()
    this.transform = new Map()
    return this
  }

  // 数据
  createAnimationData () {
    const steps = this.steps
    this.steps = []
    return steps
  }

  // 动画数据产出
  export () {
    this.id++
    return {
      id: this.id,
      actions: this.createAnimationData()
    }
  }
}

export default Animation
