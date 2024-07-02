import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const stopPullDownRefresh = ENV_OBJ.stopPullDownRefresh || envError('stopPullDownRefresh')

const startPullDownRefresh = ENV_OBJ.startPullDownRefresh || envError('startPullDownRefresh')

export {
  stopPullDownRefresh,
  startPullDownRefresh
}
