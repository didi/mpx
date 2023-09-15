import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function addPhoneContact (options = {}) {
  const opts = changeOpts(options, {
    weChatNumber: 'alipayAccount'
  })

  ALI_OBJ.addPhoneContact(opts)
}

export {
  addPhoneContact
}
