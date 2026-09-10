const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const source = fs.readFileSync('../outputs/segmented-control.mpx', 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1]
const events = []
let watcher
let props
const sandbox = {
  defineProps (definitions) {
    props = Object.fromEntries(Object.entries(definitions).map(([key, definition]) => [key, definition.value]))
    return props
  },
  ref: value => ({ value }),
  computed: getter => ({ get value () { return getter() } }),
  watch: (getter, callback) => { watcher = callback },
  useContext: () => ({ triggerEvent: (name, detail) => events.push({ name, detail }) })
}
vm.runInNewContext(script.replace(/^import .*$/m, '') + '\nthis.api = { selectedValue, displayOptions, selectedLabel, selectOption }', sandbox)
const api = sandbox.api
assert.equal(props.label, '分类')
assert.equal(props.value, '')
assert.equal(props.disabled, false)
assert.equal(props.options.length, 0)
assert.equal(api.selectedLabel.value, '未选择')
props.controlKey = 'category'
props.options = [
  { value: 'a', label: '这是一个需要单行省略的很长很长的中文分类名称' },
  { value: 'b', label: '禁用项', disabled: true },
  { value: 'c', label: '可选项' }
]
const tap = index => api.selectOption({ currentTarget: { dataset: { index } } })
tap(0)
assert.equal(api.selectedValue.value, 'a')
assert.equal(api.selectedLabel.value, props.options[0].label)
assert.equal(api.displayOptions.value[0].selected, true)
assert.equal(events[0].name, 'change')
assert.equal(JSON.stringify(events[0].detail), JSON.stringify({ controlKey: 'category', value: 'a' }))
tap(1)
assert.equal(events.length, 1)
assert.equal(api.selectedValue.value, 'a')
props.disabled = true
assert.equal(api.displayOptions.value.every(option => option.disabled), true)
tap(2)
assert.equal(events.length, 1)
props.disabled = false
props.value = 'c'
watcher(props.value)
assert.equal(api.selectedValue.value, 'c')
assert.equal(api.selectedLabel.value, '可选项')
assert.equal(events.length, 1)
props.options = [{ value: 'c', label: '更新后的名称' }]
assert.equal(api.selectedLabel.value, '更新后的名称')
props.options = []
assert.equal(api.selectedLabel.value, '未选择')
tap(0)
assert.equal(events.length, 1)
const config = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
assert.deepEqual(config, { component: true })
assert.match(source, /scroll-x="\{\{true\}\}"/)
assert.match(source, /min-width: 100px/)
assert.match(source, /flex-shrink: 0/)
assert.match(source, /white-space: nowrap/)
assert.match(source, /text-overflow: ellipsis/)
console.log('PASS: defaults, selection, event payload, item/global disabled, parent-value sync callback, derived labels, empty options, component-only JSON, horizontal scroll and ellipsis declarations.')
console.log('LIMIT: mocked reactivity and context; no Mpx compilation, eslint/Jest, WeChat WebView/Skyline execution or visual verification.')
