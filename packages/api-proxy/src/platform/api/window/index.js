import { ENV_OBJ, envError } from '../../../common/js'

const onWindowResize = ENV_OBJ.onWindowResize || envError('onWindowResize')

const offWindowResize = ENV_OBJ.offWindowResize || envError('offWindowResize')

export {
  onWindowResize,
  offWindowResize
}
