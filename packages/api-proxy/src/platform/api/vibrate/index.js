import { ENV_OBJ, envError } from '../../../common/js'

const vibrateShort = ENV_OBJ.vibrateShort || envError('vibrateShort')

const vibrateLong = ENV_OBJ.vibrateLong || envError('vibrateLong')

export {
  vibrateShort,
  vibrateLong
}
