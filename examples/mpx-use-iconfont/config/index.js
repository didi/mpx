const mpxLoaderConf = require('./mpxLoader.conf')
const mpxPluginConf = require('./mpxPlugin.conf')
const userConf = require('./user.conf')

const supportedModes = ['wx', 'ali', 'swan', 'qq', 'tt', 'qa', 'jd', 'dd']

if (userConf.transWeb) {
  supportedModes.push('web')
}

const options = {
  userConf,
  mpxLoaderConf,
  mpxPluginConf,
  supportedModes
}


module.exports = options
