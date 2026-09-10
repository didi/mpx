const fs = require('fs')
const vm = require('vm')
const path = require('path')
const source = fs.readFileSync(path.join(__dirname, '../outputs/segmented-control.mpx'), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+\n/, '')
function mount(input = {}) {
  let exposed
  let watcher
  const emit = jest.fn()
  let props
  vm.runInNewContext(script, {
    defineProps(definitions) {
      props = Object.assign(Object.fromEntries(Object.entries(definitions).map(([key, definition]) => [key, definition.value])), input)
      return props
    },
    useContext: () => ({ triggerEvent: emit }),
    ref: value => ({ value }),
    computed: getter => ({ get value() { return getter() } }),
    watch: (getter, callback) => { watcher = callback },
    defineExpose: value => { exposed = value }
  })
  return { props, exposed, emit, sync(value) { props.value = value; watcher(value) } }
}
const options = [{ value: 'a', label: '这是一个很长的中文选项名称' }, { value: 'b', label: '乙', disabled: true }, { value: 'c', label: '丙' }]
test('defaults and empty selection', () => {
  const instance = mount()
  expect(instance.props.label).toBe('分类')
  expect(instance.props.value).toBe('')
  expect(instance.props.disabled).toBe(false)
  expect(instance.exposed.displayOptions.value).toEqual([])
  expect(instance.exposed.selectedLabel.value).toBe('未选择')
})
test('local selection emits exact detail and derives visible state', () => {
  const instance = mount({ controlKey: 'category', options })
  instance.exposed.selectOption(0)
  expect(instance.emit).toHaveBeenCalledWith('change', { controlKey: 'category', value: 'a' })
  expect(instance.exposed.selectedLabel.value).toBe(options[0].label)
  expect(instance.exposed.displayOptions.value[0].selected).toBe(true)
  instance.exposed.selectOption(0)
  expect(instance.emit).toHaveBeenCalledTimes(1)
})
test('parent value sync, options updates and disabled guards', () => {
  const instance = mount({ options, value: 'a' })
  instance.exposed.selectOption(1)
  expect(instance.emit).not.toHaveBeenCalled()
  instance.props.disabled = true
  instance.exposed.selectOption(2)
  expect(instance.emit).not.toHaveBeenCalled()
  expect(instance.exposed.displayOptions.value.every(item => item.disabled)).toBe(true)
  instance.sync('c')
  expect(instance.exposed.selectedLabel.value).toBe('丙')
  expect(instance.emit).not.toHaveBeenCalled()
  instance.props.options = []
  expect(instance.exposed.selectedLabel.value).toBe('未选择')
})
