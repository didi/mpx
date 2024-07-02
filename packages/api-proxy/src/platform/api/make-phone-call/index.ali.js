import { changeOpts } from '../../../common/js'

function makePhoneCall (options = {}) {
  const opts = changeOpts(options, {
    phoneNumber: 'number'
  })
  my.makePhoneCall(opts)
}

export {
  makePhoneCall
}
