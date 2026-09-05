'use strict'

const productExposure = {
  async create () {
    return {
      track () {},
      destroy () {}
    }
  }
}

module.exports = productExposure
module.exports.default = productExposure
