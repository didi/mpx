const fs = require('fs')
const vm = require('vm')
const path = require('path')
const source = fs.readFileSync(path.join(__dirname, 'component.js'), 'utf8')
let component
vm.runInNewContext(source.replace(/^import .*$/m, ''), {
  createComponent (options) { component = options }
})
test.each(['skyline', 'webview'])('press and release work in %s without wx animation API', renderer => {
  const instance = Object.assign({ renderer }, component.data)
  component.attached.call(instance)
  expect(instance.isSkyline).toBe(renderer === 'skyline')
  expect(instance.pressed).toBe(false)
  component.methods.press.call(instance)
  expect(instance.pressed).toBe(true)
  component.methods.release.call(instance)
  expect(instance.pressed).toBe(false)
})
