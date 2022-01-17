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

if (userConf.needDll) {
  options.dllConf = require('./dll.conf')
}

module.exports = options
