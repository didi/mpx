import { changeOpts, handleSuccess } from '../../../common/js'

function setNavigationBarTitle (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  if (my.canIUse('setNavigationBarTitle')) {
    my.setNavigationBarTitle(options)
    return
  }
  my.setNavigationBar(options)
}

function setNavigationBarColor (options = {}) {
  if (my.canIUse('setNavigationBarColor')) {
    my.setNavigationBarColor(options)
    return
  }
  my.setNavigationBar(options)
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
