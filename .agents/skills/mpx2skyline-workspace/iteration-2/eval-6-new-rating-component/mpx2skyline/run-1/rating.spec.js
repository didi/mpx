const fs = require('fs')
const vm = require('vm')
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/rating-selector.mpx'), 'utf8')
let component
vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+/, ''), {
  createComponent (options) { component = options }
})
function instance (props = {}) {
  const ctx = Object.assign({}, component.data, { ratingKey: 'service', value: 0, max: 5, readonly: false }, props)
  ctx.triggerEvent = jest.fn()
  Object.keys(component.methods).forEach(key => { ctx[key] = component.methods[key].bind(ctx) })
  component.watch.value.handler.call(ctx, ctx.value)
  return ctx
}
const event = value => ({ currentTarget: { dataset: { value } } })
test('property defaults and initial/external value synchronization', () => {
  expect(component.properties.value.value).toBe(0)
  expect(component.properties.max.value).toBe(5)
  expect(component.properties.readonly.value).toBe(false)
  expect(component.properties.label.value).toBe('评分')
  expect(component.watch.value.immediate).toBe(true)
  const ctx = instance({ value: 3 })
  expect(ctx.localRating).toBe(3)
  component.watch.value.handler.call(ctx, 1)
  expect(ctx.localRating).toBe(1)
  expect(ctx.triggerEvent).not.toHaveBeenCalled()
})
test('click updates local score and emits key and numeric value', () => {
  const ctx = instance()
  ctx.selectRating(event('4'))
  expect(ctx.localRating).toBe(4)
  expect(ctx.triggerEvent).toHaveBeenCalledWith('change', { ratingKey: 'service', value: 4 })
})
test('readonly blocks local changes and events', () => {
  const ctx = instance({ readonly: true, value: 2 })
  ctx.selectRating(event(5))
  ctx.pressStar(event(5))
  expect(ctx.localRating).toBe(2)
  expect(ctx.pressedValue).toBe(0)
  expect(ctx.triggerEvent).not.toHaveBeenCalled()
})
test('press, release and cancel restore scale state', () => {
  const ctx = instance()
  ctx.pressStar(event(3))
  expect(ctx.pressedValue).toBe(3)
  ctx.releaseStar()
  expect(ctx.pressedValue).toBe(0)
  ctx.pressStar(event(1))
  ctx.releaseStar()
  expect(ctx.pressedValue).toBe(0)
  expect(source).toContain('bindtouchcancel="releaseStar"')
  expect(source).toContain('bindtouchend="releaseStar"')
})
test('max controls array count including empty stars', () => {
  expect(Array.from(component.computed.stars.call({ max: 5 }))).toEqual([1, 2, 3, 4, 5])
  expect(Array.from(component.computed.stars.call({ max: 2 }))).toEqual([1, 2])
  expect(Array.from(component.computed.stars.call({ max: 0 }))).toEqual([])
})
test('valid component JSON and both renderer label truncation', () => {
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
  expect(source).toContain('max-lines="{{1}}" overflow="ellipsis">{{label}}</text>')
  expect(source).toContain('text-overflow: ellipsis')
})
