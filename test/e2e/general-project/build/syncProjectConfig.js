const fs = require('fs')
const path = require('path')
const rootPath = process.cwd()
const distDir = `${rootPath}/dist`
const staticDir = `${rootPath}/static`
const configNames = ['project.config.json', 'project.private.config.json', 'mini.project.json', 'project.swan.json']

function mkdirSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

function syncProjectConfig () {
  if (fs.existsSync(distDir)){
    const distFiles = fs.readdirSync(distDir)
    distFiles.forEach((platform) =>{
      if (platform === 'web') return
      configNames.forEach(configName => {
        const distFilePath = `${distDir}/${platform}/${configName}`
        const targetDirPath = `${staticDir}/${platform}`
        if (fs.existsSync(distFilePath)) {
          if (!fs.existsSync(targetDirPath)) {
            mkdirSync(targetDirPath)
          }
          const fileContent = fs.readFileSync(distFilePath, 'utf-8')
          fs.writeFileSync(`${targetDirPath}/${configName}`, fileContent, 'utf8')
        }
      })
    })
  }
}

module.exports = {
  syncProjectConfig
}
