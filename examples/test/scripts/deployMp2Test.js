/* eslint-disable no-new-require */
const client = require('scp2')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const projectName = require(path.resolve(process.cwd(), 'package.json')).name
const compressName = 'miniprogram'
const zipCommand = `zip -r ${compressName}.zip dist`
const removeCommand = `rm -rf ${compressName}.zip`
const deployConfig = {
  src: `${compressName}.zip`,
  remote: {
    template: {
      host: '10.96.95.200',
      username: 'xiaoju',
      password: '123456!',
      path: `/home/xiaoju/project/driver-biz/${projectName}`
    }
  }
}

zip()

async function zip() {
  const { stderr } = await exec(zipCommand)
  if (stderr) {
    console.log('stderr', stderr)
  } else {
    scp(deployConfig.src, deployConfig)
  }
}

async function removeZip() {
  const { stderr } = await exec(removeCommand)
  if (stderr) {
    console.log('remove error', stderr)
  }
}

function scp(src, deployConfig) {
  const mkdirClient = new client.Client({
    host: deployConfig.remote.template.host,
    username: deployConfig.remote.template.username,
    password: deployConfig.remote.template.password
  })
  // mode是指创建文件夹的权限
  mkdirClient.mkdir(
    deployConfig.remote.template.path,
    { mode: 755 },
    function () {
      client.scp(
        src,
        {
          host: deployConfig.remote.template.host,
          username: deployConfig.remote.template.username,
          password: deployConfig.remote.template.password,
          path: deployConfig.remote.template.path
        },
        function (err) {
          if (err) {
            console.log(err)
          } else {
            removeZip()
            console.log('deploy finished')
          }
        }
      )
      mkdirClient.close()
    }
  )
}
