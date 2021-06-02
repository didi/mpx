const { capitalToHyphen } = require('../../../../utils/string')

module.exports = function () {
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
