const path = require('path')

function resolveSrc (file, subDir = '') {
  return path.resolve(__dirname, '../src', subDir, file || '')
}

function resolveDist (platform, subDir = '') {
  return path.resolve(__dirname, '../dist', platform, subDir)
}

function resolve (file) {
  return path.resolve(__dirname, '..', file || '')
}

function normalizeArr (arrCfg) {
  if (Array.isArray(arrCfg) && arrCfg.length) {
    return arrCfg
  } else if (arrCfg) {
    return [arrCfg]
  }
  return []
}

function getRootPath (mode, env) {
  return env ? `${mode}:${env}` : mode
}

module.exports = {
  resolve,
  resolveSrc,
  resolveDist,
  normalizeArr,
  getRootPath
}
