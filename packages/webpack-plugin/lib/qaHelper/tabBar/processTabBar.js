const fs = require('fs')
const config = require('../../config')
const parseComponent = require('../../parser')
const { processJson } = require('./utils')

module.exports = function (parts, { mode, defs }, callback) {
  const json = parts.json || parts.json.content || {}
  const tabBar = json.tabBar
  if (tabBar) {
    const filePath = __dirname + './tabBar.mpx'
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return callback(err)
      try {
        const parts = parseComponent(data, filePath, false, mode, defs)
        // 处理json
        parts.json.usingComponent = processJson(parts.json)
        // 加入到entry中
      } catch (e) {
        callback(e)
      }
      callback()
    })
  }
}