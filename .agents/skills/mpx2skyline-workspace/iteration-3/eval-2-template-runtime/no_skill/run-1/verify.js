const fs = require('fs')
const path = require('path')
const source = fs.readFileSync(path.join(__dirname, '../outputs/user-list.mpx'), 'utf8')
fs.writeFileSync(path.join(__dirname, 'component-script.js'), source.match(/<script>([\s\S]*?)<\/script>/)[1])
