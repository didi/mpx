const fs = require('fs')
const vm = require('vm')
const source = fs.readFileSync(__dirname + '/component.js', 'utf8')
let options
vm.runInNewContext(source.replace("import { createComponent } from '@mpxjs/core'", ''), {
  createComponent: value => { options = value }
})
test.each(['skyline', 'webview'])('selects %s renderer', renderer => {
  const instance = { renderer, isSkyline: false }
  options.attached.call(instance)
  expect(instance.isSkyline).toBe(renderer === 'skyline')
})
test('opens then closes modal', () => {
  const instance = { opened: false }
  options.methods.open.call(instance)
  expect(instance.opened).toBe(true)
  options.methods.close.call(instance)
  expect(instance.opened).toBe(false)
})
