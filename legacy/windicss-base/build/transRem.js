const fs = require('fs/promises')
const path = require('path')

const resolve = (file) => path.resolve(__dirname, '..', file)

const files = [resolve('lib/index.js')]

function transRem (content) {
  return content.replace(/(\d+(\.\d+)?)rem/g, (match, p1) => `${p1 * 37.5}rpx`)
}

async function doBuild (files) {
  await Promise.all(files.map(async (file) => {
    let content = await fs.readFile(file, { encoding: 'utf8' })
    await fs.writeFile(file, transRem(content))
  }))
}

doBuild(files).catch((e) => {
  console.error(e)
})
