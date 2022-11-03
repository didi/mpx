const path = require('path')

function resolveSrc (file, subDir = '') {
  return path.join(__dirname, '../src', subDir, file || '')
}

function resolveDist (platform, subDir = '') {
  return path.join(__dirname, '../dist', platform, subDir)
}

function resolve (file) {
  return path.join(__dirname, '..', file || '')
}

function normalizeArr (arrCfg) {
  if (Array.isArray(arrCfg) && arrCfg.length) {
    return arrCfg
  } else if (arrCfg) {
    return [arrCfg]
  }
  return []
}

function getRootPath (...args) {
  return args.filter(item => item).join('_')
}

function getConf (conf, options) {
  return typeof conf === 'function' ? conf(options) : conf
}

module.exports = {
  resolve,
  resolveSrc,
  resolveDist,
  normalizeArr,
  getRootPath,
  getConf
}
