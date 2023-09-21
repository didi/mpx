const fs = require('fs')

const targets = fs.readdirSync('packages').filter(target => {
  if (!fs.statSync(`packages/${target}`).isDirectory()) {
    return false
  }

  const pkg = require(`../packages/${target}/package.json`)

  if (!pkg.buildOptions) {
    return false
  }

  return true
})

module.exports = {
  targets
}
