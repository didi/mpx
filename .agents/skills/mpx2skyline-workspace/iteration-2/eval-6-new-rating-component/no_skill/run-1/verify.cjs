const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const source = fs.readFileSync(`${__dirname}/../outputs/rating-selector.mpx`, 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
let options
vm.runInNewContext(script.replace(/import .* from '@mpxjs\/core'/, ''), {
  createComponent (value) { options = value }
})
assert.equal(options.properties.value.value, 0)
assert.equal(options.properties.max.value, 5)
assert.equal(options.properties.readonly.value, false)
assert.equal(options.properties.label.value, '评分')
const emitted = []
const instance = Object.assign({}, options.data, options.methods, {
  value: 2, max: 5, readonly: false, ratingKey: 'service',
  triggerEvent (name, detail) { emitted.push({ name, detail }) }
})
options.attached.call(instance)
assert.equal(instance.currentValue, 2)
assert.equal(options.computed.stars.call(instance).length, 5)
instance.max = 7
assert.equal(options.computed.stars.call(instance).length, 7)
const event = { currentTarget: { dataset: { value: 3 } } }
instance.pressStar(event)
assert.equal(instance.pressedValue, 3)
instance.releaseStar()
assert.equal(instance.pressedValue, 0)
instance.selectRating(event)
assert.equal(instance.currentValue, 3)
assert.equal(JSON.stringify(emitted), JSON.stringify([{ name: 'change', detail: { ratingKey: 'service', value: 3 } }]))
options.properties.value.observer.call(instance, 4)
assert.equal(instance.currentValue, 4)
instance.readonly = true
instance.selectRating(event)
instance.pressStar(event)
assert.equal(instance.currentValue, 4)
assert.equal(instance.pressedValue, 0)
assert.equal(emitted.length, 1)
assert.equal(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1]).component, true)
assert.match(source, /bindtouchcancel="releaseStar"/)
assert.match(source, /transition: transform 150ms/)
assert.match(source, /transform: scale\(0\.96\)/)
assert.match(source, /max-lines="1"/)
console.log('PASS: property defaults, initial value, dynamic max, press/release, local rating, change detail, parent synchronization, readonly, component JSON and static bindings')
