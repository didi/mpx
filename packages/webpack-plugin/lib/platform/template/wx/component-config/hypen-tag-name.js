const { capitalToHyphen } = require('../../../../utils/string')

module.exports = function () {
  return {
    // tag name contains capital letters
    test: /[A-Z]/,
    ali: capitalToHyphen,
    swan: capitalToHyphen
  }
}
