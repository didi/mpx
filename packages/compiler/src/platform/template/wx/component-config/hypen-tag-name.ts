import { capitalToHyphen } from '@mpxjs/compile-utils'
import { DefineConfig } from '.'

export default <DefineConfig> function () {
  function convertTagName (name: string) {
    return capitalToHyphen(name)
  }

  return {
    // tag name contains capital letters
    test: /[A-Z]/,
    ali: convertTagName,
    swan: convertTagName
  }
}
