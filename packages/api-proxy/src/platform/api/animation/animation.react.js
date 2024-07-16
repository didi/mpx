class Animation {
  // unit: string
  // id: number
  // DEFAULT: IAnimationAttr

  constructor (
    {
      duration = 400,
      delay = 0,
      timingFunction = 'linear',
      transformOrigin = '50% 50% 0',
      // unit = 'px'
    } = {}
  ) {
    // 默认值
    this.setDefault(duration, delay, timingFunction, transformOrigin)
    // this.unit = unit
  }

  // transformUnit (...args) { // Todo 单位换算
  //   // const ret: string[] = []
  //   const ret = []
  //   args.forEach(each => {
  //     ret.push(isNaN(each) ? each : `${each}${this.unit}`)
  //   })
  //   return ret
  // }

  // 设置默认值
  setDefault (duration, delay, timingFunction, transformOrigin) {
    this.DEFAULT = { duration, delay, timingFunction, transformOrigin }
  }

  // 属性组合
  rules = new Map()
  // transform 对象
  transform = new Map()
  // 组合动画
  steps = []

  matrix (a, b, c, d, tx, ty) {
    this.transform.set('matrix', [a, b, c, d, tx, ty])
    return this
  }
  matrix3d (a1, b1, c1, d1,
            a2, b2, c2, d2,
            a3, b3, c3, d3,
            a4, b4, c4, d4
  ) {
    this.transform.set('matrix3d', [
      a1, b1, c1, d1,
      a2, b2, c2, d2,
      a3, b3, c3, d3,
      a4, b4, c4, d4
    ])
    return this
  }

  rotate (angle) {
    this.transform.set('matrix3d', angle)
    return this
  }

  rotate3d (x, y, z, angle) {
    if (typeof y !== 'number') {
      this.transform.set('rotate3d', x)
    } else {
      this.transform.set('rotate3d', [x, y, z, angle]) // Todo
    }
    return this
  }

  rotateX (angle) {
    this.transform.set('rotateX', angle)
    return this
  }

  rotateY (angle) {
    this.transform.set('rotateY', angle)
    return this
  }

  rotateZ (angle) {
    this.transform.set('rotateZ', angle)
    return this
  }

  scale (x, y) {
    const scaleY = (typeof y !== 'undefined' && y !== null) ? y : x
    this.transform.set('scale', [x, scaleY])
    return this
  }

  scale3d (x, y, z) {
    this.transform.set('scale3d', [x, y, z])
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

  scaleZ (scale) {
    this.transform.set('scaleZ', scale)
    return this
  }

  skew (x, y) {
    this.transform.set('skew', [x, y])
    return this
  }

  skewX (angle) {
    this.transform.set('skewX', angle)
    return this
  }

  skewY (angle) {
    this.transform.set('skewY', angle)
    return this
  }

  translate (x, y) {
    // [x, y] = this.transformUnit(x, y)
    this.transform.set('translate', [x, y])
    return this
  }

  translate3d (x, y, z) {
    // [x, y, z] = this.transformUnit(x, y, z)
    this.transform.set('translate3d', [x, y, z])
    return this
  }

  translateX (translate) {
    // [translate] = this.transformUnit(translate)
    this.transform.set('translateX', translate)
    return this
  }

  translateY (translate) {
    // [translate] = this.transformUnit(translate)
    this.transform.set('translateY', translate)
    return this
  }

  translateZ (translate) {
    // [translate] = this.transformUnit(translate)
    this.transform.set('translateZ', translate)
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
    // [value] = this.transformUnit(value)
    this.rules.set('width', value)
    return this
  }

  height (value) {
    // [value] = this.transformUnit(value)
    this.rules.set('height', value)
    return this
  }

  top (value) {
    // [value] = this.transformUnit(value)
    this.rules.set('top', value)
    return this
  }

  right (value) {
    // [value] = this.transformUnit(value)
    this.rules.set('right', value)
    return this
  }

  bottom (value) {
    // [value] = this.transformUnit(value)
    this.rules.set('bottom', value)
    return this
  }

  left (value) {
    // [value] = this.transformUnit(value)
    this.rules.set('left', value)
    return this
  }

  // 关键帧载入
  step (arg = {}) {
    const { DEFAULT } = this
    const {
      duration = DEFAULT.duration,
      delay = DEFAULT.delay,
      timingFunction = DEFAULT.timingFunction,
      transformOrigin = DEFAULT.transformOrigin,
    } = arg

    this.steps.push({
      animatedOption: {
        duration,
        delay,
        timingFunction,
        transformOrigin
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
    return this.createAnimationData()
  }
}
