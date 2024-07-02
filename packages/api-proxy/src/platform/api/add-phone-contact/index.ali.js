import { changeOpts } from '../../../common/js'

function addPhoneContact (options = {}) {
  const opts = changeOpts(options, {
    weChatNumber: 'alipayAccount'
  })

  my.addPhoneContact(opts)
}

export {
  addPhoneContact
}
