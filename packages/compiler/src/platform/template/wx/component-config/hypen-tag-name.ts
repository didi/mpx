import { capitalToHyphen } from '@mpxjs/compile-utils'

export default function () {
  function convertTagName (name) {
    return capitalToHyphen(name)
  }

  return {
    // tag name contains capital letters
    test: /[A-Z]/,
    ali: convertTagName,
    swan: convertTagName
  }
}
