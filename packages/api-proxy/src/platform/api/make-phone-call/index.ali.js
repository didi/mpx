import { ENV_OBJ, changeOpts } from '../../../common/js'

function makePhoneCall (options = {}) {
  const opts = changeOpts(options, {
    phoneNumber: 'number'
  })
  return ENV_OBJ.makePhoneCall(opts)
}

export {
  makePhoneCall
}
