import { ENV_OBJ, changeOpts, handleSuccess, defineUnsupportedProps } from '../../../common/js'

function getLocation (options = {}) {
  const opts = Object.assign(options, {
    type: 0 // 只获取经纬与微信拉齐
  })
  handleSuccess(opts, res => {
    const result = changeOpts(
      res,
      { errMsg: 'getLocation:ok' }
    )
    defineUnsupportedProps(result, ['speed'])
    return result
  })
  return ENV_OBJ.getLocation(opts)
}

function openLocation (options = {}) {
  const opts = Object.assign({
    scale: 15 // 地图缩放比例兜底值
  }, options)
  return ENV_OBJ.openLocation(opts)
}

const chooseLocation = ENV_OBJ.chooseLocation

export {
  getLocation,
  openLocation,
  chooseLocation
}
