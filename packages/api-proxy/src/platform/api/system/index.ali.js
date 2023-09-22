import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function getSystemInfo (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    res.system = `${res.platform} ${res.system}`
    res.SDKVersion = ALI_OBJ.SDKVersion

    // 支付宝 windowHeight 可能为 0
    if (!res.windowHeight) {
      res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
    }

    return res
  })

  ALI_OBJ.getSystemInfo(opts)
}

function getSystemInfoSync () {
  const res = ALI_OBJ.getSystemInfoSync() || {}

  res.system = `${res.platform} ${res.system}`
  res.SDKVersion = ALI_OBJ.SDKVersion

  // 支付宝 windowHeight 可能为 0
  if (!res.windowHeight) {
    res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
  }

  return res
}

export {
  getSystemInfo,
  getSystemInfoSync
}
