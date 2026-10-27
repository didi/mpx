const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert')
const crypto = require('crypto')
const workspace = path.resolve(process.argv[2])
const destination = path.resolve(process.argv[3])
const root = path.join(workspace, 'iteration-18')
const config = require(path.join(root, 'evals.json'))
const pluginRoot = path.join(workspace, 'node_modules/@mpxjs/webpack-plugin')
const compiler = require(pluginRoot + '/lib/template-compiler/compiler')
const genNode = require(pluginRoot + '/lib/template-compiler/gen-node-react').genNode
const getClassMap = require(pluginRoot + '/lib/react/style-helper').getClassMap
const conditionalStrip = require(pluginRoot + '/lib/style-compiler/plugins/conditional-strip')
const postcss = require(require.resolve('postcss', { paths: [pluginRoot] }))
const results = []
function block (source, tag) { return (source.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`)) || [])[1] || '' }
function sourceFor (id, group) {
  const c = config.evals.find(c => c.id === id)
  const file = path.join(root, `eval-${id}-${c.name}`, group, 'outputs', c.outputs[0])
  return { file, source: fs.readFileSync(file, 'utf8') }
}
function runScript (source, mode = 'ios', props = {}) {
  let options
  let exposed
  const mounted = []
  const loaded = []
  const watched = []
  const requests = []
  const ticks = []
  const events = []
  const proxy = new Proxy({ use () {} }, { get: (target, name) => target[name] || (args => { requests.push({ name, args }); return Promise.resolve({ data: { list: [] } }) }) })
  const sandbox = {
    __mpx_mode__: mode,
    createPage: v => { options = v },
createComponent: v => { options = v },
    mpx: proxy,
apiProxy: {},
getProxy: () => proxy,
    ref: value => ({ value }),
computed: fn => ({ get value () { return fn() } }),
    toRefs: value => Object.fromEntries(Object.keys(value).map(key => [key, { get value () { return value[key] }, set value (v) { value[key] = v } }])),
    onMounted: fn => mounted.push(fn),
onUnmounted () {},
onLoad: fn => loaded.push(fn),
    watch: (getter, handler) => watched.push({ getter, handler }),
    defineProps: () => props,
defineExpose: value => { exposed = value },
    useContext: () => ({ triggerEvent: (name, payload) => events.push({ name, payload }) }),
    console
  }
  vm.runInNewContext(block(source, 'script').replace(/^import[^\n]*\n/gm, ''), sandbox)
  return { options, exposed, mounted, loaded, watched, requests, ticks, events }
}
async function rnStyles (source) {
  const clean = await postcss([conditionalStrip({ defs: { __mpx_mode__: 'ios' } })]).process(block(source, 'style'), { from: undefined })
  return getClassMap({ content: clean.css, filename: 'audit.css', mode: 'ios', srcMode: 'wx', ctorType: 'component', formatValueName: 'unit', warn () {}, error: msg => { throw new Error(msg) } })
}
function rnTemplate (source, registrations = {}) {
  const diagnostics = []
  const parsed = compiler.parse(block(source, 'template'), { mode: 'ios', srcMode: 'wx', defs: {}, usingComponentsInfo: registrations, filePath: 'audit.mpx', warn: x => diagnostics.push(x), error: x => { throw new Error(x) }, isUrlRequest: () => false })
  return { code: genNode(parsed.root), diagnostics }
}
;(async () => {
  fs.mkdirSync(destination, { recursive: true })
  for (const group of ['mpx', 'mpx2rn']) {
    const panel = sourceFor(0, group)
    const styles = await rnStyles(panel.source)
    assert.equal(styles['summary-accent'].backgroundColor, '"#1677ff"')
    assert.equal(styles['summary-accent'].height, "unit(4, 'rpx')")
    assert.equal(styles['stat-cell'].paddingTop, "unit(16, 'rpx')")
    assert.equal(styles['stat-cell'].paddingBottom, "unit(16, 'rpx')")
    results.push({ group, eval_id: 0, pseudo_node: panel.source.includes('<view class="summary-accent">'), styles: Object.fromEntries(['summary-accent', 'stat-cell', 'stat-card', 'detail-section', 'detail-header'].map(c => [c, styles[c]])) })
    const order = sourceFor(1, group)
    const page = runScript(order.source)
    const generated = rnTemplate(order.source).code
    assert(generated.includes('getComponent("mpx-scroll-view")'))
    assert(generated.includes('bindscrolltolower'))
    results.push({ group, eval_id: 1, rn_lifecycles: ['onShareAppMessage', 'onShareTimeline', 'onTabItemTap'].filter(k => typeof page.options[k] === 'function'), wx_lifecycles: ['onShareAppMessage', 'onShareTimeline', 'onTabItemTap'].filter(k => typeof runScript(order.source, 'wx').options[k] === 'function'), rn_scroll_view: true, rn_scroll_to_lower: true })
    fs.writeFileSync(path.join(destination, `eval-1-${group}-rn-template.js`), generated)
    const carousel = sourceFor(2, group)
    const carouselCode = rnTemplate(carousel.source, { 'pay-form': {}, 'lottie-view': {} }).code
    assert(carouselCode.includes('key: "toast-mask"'))
    assert(carouselCode.includes('key: "toast-placeholder"'))
    const carouselStyles = await rnStyles(carousel.source)
    const instance = runScript(carousel.source)
    const props = { title: 'before', subtitle: 'sub' }
    const refs = instance.options.setup(props, { nextTick: fn => instance.ticks.push(fn), selectComponent () {}, createIntersectionObserver: () => ({ relativeTo () { return this }, relativeToViewport () { return this }, observe (selector, cb) { cb({ intersectionRatio: 1 }) }, disconnect () {} }) })
    const firstOpacity = refs.animStyle.value.opacity
    instance.mounted.forEach(fn => fn())
    while (instance.ticks.length) instance.ticks.shift()()
    const request = instance.requests.find(r => r.name === 'request')
    if (request && request.args.success) request.args.success({ data: { list: [{ id: 'one' }] } })
    const opacityBeforeNextTick = refs.animStyle.value.opacity
    const itemsBeforeNextTick = refs.items.value.length
    while (instance.ticks.length) instance.ticks.shift()()
    props.title = 'after'
    assert.equal((refs.title || refs.cardTitle).value, 'after')
    results.push({ group, eval_id: 2, distinct_keys: true, css: Object.fromEntries(['toast-mask', 'toast-mask-visible', 'method-selector', 'method-top-border'].map(k => [k, carouselStyles[k]])), firstOpacity, itemsBeforeNextTick, opacityBeforeNextTick, opacityAfterNextTick: refs.animStyle.value.opacity, props_reactive: true })
    fs.writeFileSync(path.join(destination, `eval-2-${group}-rn-template.js`), carouselCode)
    const rating = sourceFor(3, group)
    const ratingCode = rnTemplate(rating.source, { 'rating-editable-tip': {}, 'rating-readonly-tip': {} })
    assert(ratingCode.code.includes('rating-editable-tip') && ratingCode.code.includes('rating-readonly-tip'))
    assert.equal(ratingCode.diagnostics.length, 0)
    const ratingOptions = runScript(rating.source).options
    const payloads = []
    const state = { readonly: false, ratingKey: 'rating', max: 5, currentValue: 0, triggerEvent: (name, payload) => payloads.push({ name, payload }) }
    ratingOptions.methods.selectRating.call(state, 3)
    assert.equal(state.currentValue, 3)
    assert.equal(payloads[0].payload.value, 3)
    assert.equal(payloads[0].payload.ratingKey, 'rating')
    state.readonly = true
    ratingOptions.methods.selectRating.call(state, 4)
    assert.equal(state.currentValue, 3)
    assert.equal(payloads.length, 1)
    ratingOptions.watch.value.handler.call(state, 2)
    assert.equal(state.currentValue, 2)
    results.push({ group, eval_id: 3, dynamic_components_compile: true, rating_change_and_readonly_and_prop_watch: true })
    fs.writeFileSync(path.join(destination, `eval-3-${group}-rn-template.js`), ratingCode.code)
    const segmented = sourceFor(4, group)
    const segmentProps = { controlKey: 'seg', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }], value: 'a', disabled: false, label: 'L' }
    const control = runScript(segmented.source, 'ios', segmentProps)
    control.exposed.selectOption(segmentProps.options[1])
    assert.equal(control.events.length, 0)
    control.exposed.selectOption(segmentProps.options[0])
    assert.equal(control.events.length, 1)
    assert.equal(control.events[0].payload.controlKey, 'seg')
    segmentProps.disabled = true
    control.exposed.selectOption(segmentProps.options[0])
    assert.equal(control.events.length, 1)
    segmentProps.value = 'b'
    control.watched.forEach(w => w.handler(w.getter()))
    assert.equal(control.exposed.currentValue.value, 'b')
    assert.equal(control.exposed.selectedLabel.value, 'B')
    results.push({ group, eval_id: 4, disabled_guards_change_event_prop_watch_and_computed_label: true })
    const board = sourceFor(5, group)
    const taskPage = runScript(board.source)
    assert.equal(taskPage.loaded.length, 1)
    taskPage.loaded[0]({ category: 'life' }, { category: 'work' })
    assert.equal(taskPage.exposed.currentCategory.value, 'work')
    assert(taskPage.exposed.filteredTasks.value.every(task => task.category === 'work'))
    const task = taskPage.exposed.filteredTasks.value[0]
    const before = task.completed
    taskPage.exposed.toggleTask(task.taskKey)
    assert.equal(task.completed, !before)
    taskPage.loaded[0]({ category: 'work' }, { category: 'invalid' })
    assert.equal(taskPage.exposed.currentCategory.value, 'all')
    results.push({ group, eval_id: 5, decoded_query_precedence_and_invalid_fallback_filter_and_toggle: true })
  }
  const hashes = config.evals.flatMap(c => ['mpx', 'mpx2rn'].map(group => {
    const data = sourceFor(c.id, group)
    return { file: path.relative(root, data.file), sha256: crypto.createHash('sha256').update(data.source).digest('hex') }
  }))
  fs.writeFileSync(path.join(destination, 'semantic-checks.json'), JSON.stringify({ compiler: require(pluginRoot + '/package.json').version, note: 'script probes execute output script with minimal lifecycle/reactivity/host stubs; not a native-device test', results, hashes }, null, 2))
  console.log(JSON.stringify(results, null, 2))
})().catch(error => { console.error(error); process.exitCode = 1 })
