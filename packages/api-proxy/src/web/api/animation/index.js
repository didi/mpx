import Animation from './animation'

const createAnimation = function (options = {}) {
  options = Object.assign({
    duration: 400,
    timingFunction: 'linear',
    delay: 0,
    transformOrigin: '50% 50% 0'
  }, options)
  return new Animation(options)
}

export {
  createAnimation
}
