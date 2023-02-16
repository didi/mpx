const pkg = require('../package.json')
let projectName = pkg.bizProjectName

const baseUrl = '//h5test.intra.xiaojukeji.com/driver-activity-biz'

if (process.env.npm_config_feature) {
  const feature = process.env.npm_config_feature
  const exclude = ['css', 'fonts', 'js', 'img']
  if (exclude.includes(feature)) {
    throw new Error('feature 名字不能为以下之一：' + exclude.join(','))
  }

  projectName += '/' + process.env.npm_config_feature
  console.log('==========project path is:============\n', projectName)
}

const remotePath = baseUrl + '/' + projectName

module.exports = {
  outputDir: 'deploy',
  publicPath: remotePath + '/',
  // 远程机器配置
  remote: {
    /* NEED_MODIFY: 测试地址 */
    testUrl: remotePath + '/index.html',
    // 模板配置
    template: {
      /* NEED_MODIFY: 模板文件 .html 发布到的目标机器 host */
      host: '10.96.95.200',
      /* NEED_MODIFY: 目标机器用户名 */
      username: 'xiaoju',
      /* NEED_MODIFY: 目标机器密码 */
      password: '123456!',
      /* NEED_MODIFY: 目标机器上的模板路径 */
      path: '/home/xiaoju/project/driver-activity-biz/' + projectName
    },
    assets: {
      /* NEED_MODIFY: 静态资源文件发布到的目标机器 host */
      host: '10.96.95.200',
      /* NEED_MODIFY: 目标机器用户名 */
      username: 'xiaoju',
      /* NEED_MODIFY: 目标机器密码 */
      password: '123456!',
      /* NEED_MODIFY: 目标机器上的静态资源 path */
      path: '/home/xiaoju/project/driver-activity-biz/' + projectName
    }
  }
}
