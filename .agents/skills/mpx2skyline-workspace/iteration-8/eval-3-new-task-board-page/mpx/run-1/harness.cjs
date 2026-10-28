const fs = require('fs')
const path = require('path')
const vm = require('vm')
const Vue = require('vue')
const babel = require('@babel/core')
const parser = require('@mpxjs/webpack-plugin/lib/parser')
const setupLoader = require('@mpxjs/webpack-plugin/lib/script-setup-compiler')
const base = path.resolve(__dirname, '../outputs')

async function load (relative, ctorType) {
  const file = path.join(base, relative)
  const source = fs.readFileSync(file, 'utf8')
  const sfc = parser(source, { filePath: file, mode: 'wx' })
  let script = sfc.script.content
  if (sfc.script.setup) {
    script = await new Promise((resolve, reject) => {
      setupLoader.call({
        resource: file + '?ctorType=' + ctorType,
        resourcePath: file,
        async: () => (error, result) => error ? reject(error) : resolve(result)
      }, script)
    })
  }
  fs.mkdirSync(path.join(__dirname, 'compiled-scripts'), { recursive: true })
  fs.writeFileSync(path.join(__dirname, 'compiled-scripts', path.basename(relative) + '.js'), script)
  const code = babel.transformSync(script, {
    babelrc: false,
    configFile: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]
  }).code
  const nodes = Array.from(sfc.template.content.matchAll(/<([\w-]+)\b([^>]*?)>/gs)).map(match => {
    const attrs = {}
    Array.from(match[2].matchAll(/([^\s=]+)="([^"]*)"/g)).forEach(attr => { attrs[attr[1]] = attr[2] })
    return { tag: match[1], attrs }
  })
  return { source, nodes, code, json: JSON.parse(sfc.json.content) }
}

function mount (definition, overrides = {}, query = {}) {
  let options
  const hooks = {}
  const events = []
  const apiCalls = []
  const api = {
    getWindowInfo: () => ({ windowHeight: 640, windowWidth: 320, statusBarHeight: 24 }),
    getMenuButtonBoundingClientRect: () => ({ top: 28, height: 32, left: 224 }),
    navigateBack: value => apiCalls.push(['navigateBack', value]),
    reLaunch: value => apiCalls.push(['reLaunch', value])
  }
  const core = Object.assign({}, Vue, {
    createComponent: value => { options = value },
    createPage: value => { options = value },
    watch: (source, callback, config) => Vue.watch(source, callback, Object.assign({}, config, { flush: 'sync' })),
    onLoad: callback => { hooks.load = callback },
    onResize: callback => { hooks.resize = callback },
    onUnmounted: callback => { hooks.unmount = callback }
  })
  const sandbox = {
    require: name => {
      if (name === '@mpxjs/core') return core
      if (name === '@mpxjs/api-proxy') return api
      throw Error('Unexpected module: ' + name)
    },
    exports: {}, setTimeout, clearTimeout, getCurrentPages: () => [{ route: 'pages/task-board' }]
  }
  vm.runInNewContext(definition.code, sandbox)
  const defaults = {}
  Object.entries(options.properties || {}).forEach(([key, descriptor]) => {
    defaults[key] = Array.isArray(descriptor.value) ? descriptor.value.slice() : descriptor.value
  })
  const props = Vue.reactive(Object.assign(defaults, overrides))
  const context = { triggerEvent: (name, detail) => events.push({ name, detail }) }
  let state
  if (options.setup) {
    state = options.setup(props, context)
  } else {
    state = Vue.reactive(Object.assign({}, props, options.data))
    state.triggerEvent = context.triggerEvent
    Object.entries(options.methods || {}).forEach(([key, value]) => { state[key] = value.bind(state) })
    Object.entries(options.computed || {}).forEach(([key, value]) => {
      Object.defineProperty(state, key, { get: value.bind(state), configurable: true, enumerable: true })
    })
    Object.entries(options.watch || {}).forEach(([key, spec]) => {
      const handler = typeof spec === 'function' ? spec : spec.handler
      Vue.watch(() => state[key], handler.bind(state), { immediate: !!spec.immediate, flush: 'sync' })
    })
  }
  const publicState = new Proxy(state, {
    get: (target, key) => Vue.unref(target[key]),
    set: (target, key, value) => {
      if (Vue.isRef(target[key])) target[key].value = value
      else target[key] = value
      return true
    }
  })
  if (hooks.load) hooks.load(query)
  function update (values) {
    Object.assign(options.setup ? props : state, values)
  }
  function node (selector) {
    const result = definition.nodes.find(entry => entry.tag === selector || (entry.attrs.class || '').split(' ').includes(selector))
    if (!result) throw Error('Missing template node: ' + selector)
    return result
  }
  function evaluate (expression, locals = {}) {
    const scope = Object.assign({}, props, publicState, locals)
    return Function('scope', 'with (scope) { return (' + expression + ') }')(scope)
  }
  function fire (selector, eventName, locals = {}, event = {}) {
    const binding = node(selector).attrs['bind' + eventName]
    if (!binding) throw Error('Missing event binding: ' + selector + ':' + eventName)
    if (/^\w+$/.test(binding)) return publicState[binding](event)
    return evaluate(binding, Object.assign({ $event: event }, locals))
  }
  function attributes (selector) {
    const attrs = {}
    Object.entries(node(selector).attrs).forEach(([key, value]) => {
      if (key.startsWith('bind') || key.startsWith('wx:')) return
      attrs[key] = value.startsWith('{{') ? evaluate(value.slice(2, -2)) : value
    })
    return attrs
  }
  function checkBindings () {
    const localSets = [{}]
    const loops = definition.nodes.filter(entry => entry.attrs['wx:for'])
    loops.forEach(entry => {
      const list = evaluate(entry.attrs['wx:for'].slice(2, -2))
      if (!Array.isArray(list)) throw Error('Non-array template list')
      if (list.length) localSets.push({ item: list[0], index: 0 })
    })
    Array.from(definition.source.split('</template>')[0].matchAll(/{{([\s\S]*?)}}/g)).forEach(match => {
      const expression = match[1]
      const locals = /\bitem\b/.test(expression) ? localSets[1] : {}
      if (/\bitem\b/.test(expression) && !locals) return
      evaluate(expression, locals)
    })
  }
  return { state: publicState, props, events, apiCalls, hooks, update, fire, attributes, checkBindings, options }
}
module.exports = { load, mount, base }
