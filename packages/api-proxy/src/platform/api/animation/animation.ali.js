import { ENV_OBJ, changeOpts } from '../../../common/js'

function createAnimation (options = {}) {
  const opts = changeOpts(options, {
    timingFunction: 'timeFunction'
  })

  return ENV_OBJ.createAnimation(opts)
}

export {
  createAnimation
}
