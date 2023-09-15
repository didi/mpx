import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function makePhoneCall (options = {}) {
  const opts = changeOpts(options, {
    phoneNumber: 'number'
  })
  console.log(opts)
  ALI_OBJ.makePhoneCall(opts)
}

export {
  makePhoneCall
}
