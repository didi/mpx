const { bizProjectName } = require('../package.json')

module.exports = {
  outputDir: 'dist/web/' + bizProjectName,
  publicPath: '//static.udache.com/driver-activity-biz/' + bizProjectName + '/',
  indexPath: '../index.html'
}
