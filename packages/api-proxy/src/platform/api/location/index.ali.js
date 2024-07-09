import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function getLocation(options = {}) {
  const opts = Object.assign(options, {
    type: 0
  })
  return ENV_OBJ.getLocation(opts)
}

function openLocation(options = {}) {
  const opts = Object.assign( {
    scale: 15
  }, options)
  return ENV_OBJ.openLocation(opts)
}

const chooseLocation = ENV_OBJ.chooseLocation

export {
  getLocation,
  openLocation,
  chooseLocation
}
