// Mock host: real Mpx SFC/setup compilers + Vue reactivity, no WeChat renderer.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vue = require('vue')
const babel = require('@babel/core')
const parseSfc = require('@mpxjs/webpack-plugin/lib/parser')
const compileSetup = require('@mpxjs/webpack-plugin/lib/script-setup-compiler')

const outputDir = path.resolve(__dirname, '../outputs')
const buildDir = path.join(__dirname, 'compiled')
const pageJson = JSON.parse(fs.readFileSync(path.join(buildDir, '__validate_0.json')))
const preparedScripts = new Map()

async function prepare () {
  for (const name of ['pages/task-board', 'components/rating-selector', 'components/segmented-control']) {
    const file = path.join(outputDir, name + '.mpx')
    const sfc = parseSfc(read(file), { filePath: file, mode: 'wx' })
    let source = sfc.script.content
    if (sfc.script.setup) {
      source = await new Promise((resolve, reject) => {
        compileSetup.call({
          resource: file + '?ctorType=' + (name.startsWith('pages/') ? 'page' : 'component'),
          resourcePath: file,
          async: () => (error, code) => error ? reject(error) : resolve(code)
        }, source).catch(reject)
      })
    }
    const code = babel.transformSync(source, {
      configFile: false, babelrc: false,
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]
    }).code
    preparedScripts.set(name, code)
    fs.mkdirSync(path.join(__dirname, 'mock-scripts'), { recursive: true })
    fs.writeFileSync(path.join(__dirname, 'mock-scripts', path.basename(name) + '.js'), code)
  }
}

function read (file) { return fs.readFileSync(file, 'utf8') }
function copy (value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)) }
function compiledPath (name, extension) {
  if (name === 'pages/task-board') return path.join(buildDir, '__validate_0.' + extension)
  const tag = path.basename(name)
  return path.join(buildDir, pageJson.usingComponents[tag] + '.' + extension)
}

function nodes (wxml) {
  const result = []
  const tags = /<([\w-]+)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/g
  let tag
  while ((tag = tags.exec(wxml))) {
    const attributes = {}
    const attrs = /([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g
    let attr
    while ((attr = attrs.exec(tag[2]))) attributes[attr[1]] = attr[2] === undefined ? attr[3] : attr[2]
    result.push({ tag: tag[1], attributes })
  }
  return result
}

function evaluate (value, instance, locals = {}) {
  if (!/^{{[\s\S]*}}$/.test(value)) return value
  return vm.runInNewContext(value.slice(2, -2), Object.assign({}, instance.public, locals))
}

function mount (name, inputProps = {}, onEvent) {
  const file = path.join(outputDir, name + '.mpx')
  const code = preparedScripts.get(name)
  if (!code) throw new Error('Run prepare() before mounting: ' + name)
  let options
  const hooks = { load: [], resize: [] }
  const events = []
  const timers = []
  const core = Object.assign({}, vue, {
    createPage: value => { options = value },
    createComponent: value => { options = value },
    onLoad: fn => hooks.load.push(fn),
    onResize: fn => hooks.resize.push(fn)
  })
  const host = {
    getWindowInfo: () => ({ windowWidth: 320, windowHeight: 568, screenHeight: 568, statusBarHeight: 20, safeArea: { bottom: 548 } }),
    getMenuButtonBoundingClientRect: () => ({ top: 26, height: 32, left: 224 }),
    reLaunch: config => { host.lastRoute = config.url }
  }
  vm.runInNewContext(code, {
    require: name => { if (name === '@mpxjs/core') return core; throw new Error('Unexpected import: ' + name) },
    exports: {}, wx: host,
    setTimeout: (fn, delay) => { timers.push({ fn, delay }) }
  }, { filename: file })
  const defaults = {}
  Object.keys(options.properties || {}).forEach(key => { defaults[key] = copy(options.properties[key].value) })
  const props = vue.reactive(Object.assign(defaults, inputProps))
  const state = vue.reactive(copy(options.data) || {})
  const publicState = {}
  const stop = []
  const triggerEvent = (type, detail) => {
    events.push({ type, detail: copy(detail) })
    if (onEvent) onEvent(type, detail)
  }
  Object.keys(props).forEach(key => Object.defineProperty(publicState, key, {
    enumerable: true, get: () => props[key], set: value => { props[key] = value }
  }))
  Object.keys(state).forEach(key => Object.defineProperty(publicState, key, {
    enumerable: true, get: () => state[key], set: value => { state[key] = value }
  }))
  publicState.triggerEvent = triggerEvent
  Object.keys(options.methods || {}).forEach(key => { publicState[key] = options.methods[key].bind(publicState) })
  Object.keys(options.computed || {}).forEach(key => {
    const value = vue.computed(options.computed[key].bind(publicState))
    Object.defineProperty(publicState, key, { enumerable: true, get: () => value.value })
  })
  Object.keys(options.watch || {}).forEach(key => {
    const descriptor = options.watch[key]
    const handler = typeof descriptor === 'function' ? descriptor : descriptor.handler
    stop.push(vue.watch(() => publicState[key], handler.bind(publicState), { immediate: descriptor.immediate }))
  })
  const exposed = options.setup ? options.setup(props, { triggerEvent }) : {}
  Object.keys(exposed).forEach(key => Object.defineProperty(publicState, key, {
    enumerable: true,
    get: () => vue.isRef(exposed[key]) ? exposed[key].value : exposed[key],
    set: value => { if (vue.isRef(exposed[key])) exposed[key].value = value; else exposed[key] = value }
  }))
  return {
    name, options, props, public: publicState, hooks, events, host,
    wxml: read(compiledPath(name, 'wxml')),
    nodes: nodes(read(compiledPath(name, 'wxml'))),
    load: (query = {}) => hooks.load.forEach(fn => fn(query)),
    update: async values => { Object.assign(props, values); await vue.nextTick() },
    flushTimers: () => { timers.splice(0).forEach(timer => { if (timer.delay !== 300) throw new Error('Unexpected timer'); timer.fn() }) },
    destroy: () => stop.forEach(fn => fn())
  }
}

function findNode (instance, selector) {
  const found = instance.nodes.find(node => node.tag === selector || (node.attributes.class || '').split(' ').includes(selector) || Object.prototype.hasOwnProperty.call(node.attributes, selector))
  if (!found) throw new Error('Compiled template node not found: ' + selector)
  return found
}

function fire (instance, selector, event, locals = {}, detail = {}) {
  const node = findNode(instance, selector)
  const handler = node.attributes['bind' + event]
  if (typeof instance.public[handler] !== 'function') throw new Error('Handler not exposed: ' + handler)
  const dataset = {}
  Object.keys(node.attributes).filter(key => key.startsWith('data-')).forEach(key => {
    const name = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    dataset[name] = evaluate(node.attributes[key], instance, locals)
  })
  return instance.public[handler]({ currentTarget: { dataset }, detail })
}

function mountChild (page, tag) {
  const node = findNode(page, tag)
  const pageConfig = JSON.parse(read(path.join(outputDir, 'pages/task-board.mpx')).match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
  const componentPath = path.resolve(outputDir, 'pages', pageConfig.usingComponents[tag])
  const inputs = {}
  Object.keys(node.attributes).filter(key => !['class', 'bindchange'].includes(key)).forEach(key => {
    inputs[key] = evaluate(node.attributes[key], page)
  })
  const child = mount(path.relative(outputDir, componentPath).replace(/\.mpx$/, ''), inputs,
    (type, detail) => fire(page, tag, type, {}, detail))
  child.sync = () => child.update(Object.fromEntries(Object.keys(inputs).map(key => [key, evaluate(node.attributes[key], page)])))
  return child
}

module.exports = { prepare, mount, mountChild, fire, findNode, evaluate, copy, compiledPath, tick: vue.nextTick }
