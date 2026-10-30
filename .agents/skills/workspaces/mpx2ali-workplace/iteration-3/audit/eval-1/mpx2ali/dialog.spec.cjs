const fs = require('fs')
const path = require('path')
const vm = require('vm')
const source = fs.readFileSync(path.join(__dirname, '../address-dialog.mpx'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
function mount(mode = 'ali', platform = 'iOS') {
  let options
  const getDeviceInfo = jest.fn(() => ({ platform }))
  vm.runInNewContext(script, { createComponent: value => { options = value }, getDeviceInfo, __mpx_mode__: mode })
  const renders = []
  const instance = Object.assign({}, options.data, {
    $forceUpdate(data, cb) { Object.assign(this, data); renders.push(cb) },
    triggerEvent: jest.fn()
  })
  Object.keys(options.methods).forEach(key => { instance[key] = options.methods[key].bind(instance) })
  options.created.call(instance)
  return { instance, renders, getDeviceInfo, detach: () => options.detached.call(instance) }
}

test.each([['ali', 'iOS', true], ['ali', 'Android', false], ['wx', 'iOS', false]])('device branch %s / %s', (mode, platform, expected) => {
  const { instance, getDeviceInfo } = mount(mode, platform)
  expect(instance.isIOS).toBe(expected)
  expect(getDeviceInfo).toHaveBeenCalledTimes(mode === 'ali' ? 1 : 0)
})

test('first focus waits for the simulated host render callback', () => {
  const { instance, renders } = mount()
  instance.open()
  expect(instance.visible).toBe(true)
  expect(instance.nameFocus).toBe(false)
  renders.shift()()
  expect(instance.nameFocus).toBe(true)
})

test('close / reopen cancels old auto focus, and values survive', () => {
  const { instance, renders } = mount()
  instance.open()
  instance.setName({ detail: { value: '张三' } })
  instance.setPhone({ detail: { value: '00123' } })
  instance.select('near')
  instance.close()
  instance.open()
  renders.shift()()
  expect(instance.nameFocus).toBe(false)
  renders.shift()()
  expect(instance.nameFocus).toBe(true)
  expect([instance.name, instance.phone, instance.selected]).toEqual(['张三', '00123', 'near'])
})

test('manual phone focus wins over pending initial focus', () => {
  const { instance, renders } = mount()
  instance.open()
  instance.focusInput('phone')
  renders.shift()()
  expect(instance.phoneFocus).toBe(true)
  expect(instance.nameFocus).toBe(false)
})

test.each(['name', 'phone'])('late blur of %s does not clear the other input focus', field => {
  const { instance } = mount()
  const other = field === 'name' ? 'phone' : 'name'
  instance.focusInput(field)
  instance.focusInput(other)
  instance.blurInput(field)
  expect(instance[`${other}Focus`]).toBe(true)
  expect(instance[`${field}Focus`]).toBe(false)
})

test('confirm emits the original payload and closes', () => {
  const { instance, renders } = mount()
  instance.open()
  renders.shift()()
  instance.setName({ detail: { value: '李四' } })
  instance.setPhone({ detail: { value: '01234567890' } })
  instance.select('near')
  instance.confirm()
  expect(instance.triggerEvent).toHaveBeenCalledWith('confirm', { name: '李四', phone: '01234567890', selected: 'near' })
  expect([instance.visible, instance.nameFocus, instance.phoneFocus]).toEqual([false, false, false])
})

test('close and detach invalidate pending auto focus', () => {
  const { instance, renders, detach } = mount()
  instance.open()
  instance.close()
  renders.shift()()
  expect(instance.nameFocus).toBe(false)
  instance.open()
  detach()
  renders.shift()()
  expect(instance.nameFocus).toBe(false)
})
