import {changeOpts, error, getEnvObj, handleSuccess} from '../../../common/js'
const TIPS_NAME = '支付宝环境 mpx'
const CANVAS_MAP = {}
const ALI_OBJ = getEnvObj()

function canvasToTempFilePath (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(
      res,
      { errMsg: 'canvasToTempFilePath:ok' }
    )
  })

  ALI_OBJ.canvasToTempFilePath(options)
}

// function canvasPutImageData (options = {}) {
//   if (!CANVAS_MAP[options.canvasId]) {
//     error(`支付宝调用 ${TIPS_NAME}.putImageData 方法之前需要先调用 ${TIPS_NAME}.createCanvasContext 创建 context`)
//     return
//   }
//
//   const opts = changeOpts(options, { canvasId: '' })
//   const ctx = CANVAS_MAP[options.canvasId]
//
//   // success 里面的 this 指向参数 options
//   handleSuccess(opts, res => {
//     return changeOpts(res, undefined, { errMsg: 'canvasPutImageData:ok' }
//     )
//   }, options)
//
//   ctx.putImageData(opts)
// }

// function canvasGetImageData (options = {}) {
//   if (!CANVAS_MAP[options.canvasId]) {
//     error(`支付宝调用 ${TIPS_NAME}.getImageData 方法之前需要先调用 ${TIPS_NAME}.createCanvasContext 创建 context`)
//     return
//   }
//
//   const opts = changeOpts(options, { canvasId: '' })
//   const ctx = CANVAS_MAP[options.canvasId]
//
//   // success 里面的 this 指向参数 options
//   handleSuccess(opts, undefined, options)
//
//   ctx.getImageData(opts)
// }

export {
  canvasToTempFilePath
  // canvasPutImageData,
  // canvasGetImageData
}
