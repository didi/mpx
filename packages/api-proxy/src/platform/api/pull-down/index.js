import { ENV_OBJ, envError } from '../../../common/js'

const stopPullDownRefresh = ENV_OBJ.stopPullDownRefresh || envError('stopPullDownRefresh')

const startPullDownRefresh = ENV_OBJ.startPullDownRefresh || envError('startPullDownRefresh')

export {
  stopPullDownRefresh,
  startPullDownRefresh
}
