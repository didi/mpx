import { ENV_OBJ, changeOpts } from '../../../common/js'

function addPhoneContact (options = {}) {
  const opts = changeOpts(options, {
    weChatNumber: 'alipayAccount'
  })

  return ENV_OBJ.addPhoneContact(opts)
}

export {
  addPhoneContact
}
