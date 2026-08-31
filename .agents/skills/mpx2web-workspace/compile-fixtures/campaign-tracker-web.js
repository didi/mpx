'use strict'

const campaignTracker = {
  async create () {
    return {
      track () {},
      destroy () {}
    }
  }
}

module.exports = campaignTracker
module.exports.default = campaignTracker
