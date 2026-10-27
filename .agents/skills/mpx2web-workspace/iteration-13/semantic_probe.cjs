// Deterministic probes use the eval workspace's installed compiler and router.
const fs = require('fs')
const vm = require('vm')
const parser = require('@babel/parser')

function astOf (source) {
  return parser.parse(source, { sourceType: 'unambiguous' })
}

function capture (source, mode) {
  const options = {}
  const calls = []
  const api = { chooseLocation (request) { calls.push('chooseLocation'); request.success({ name: 'probe-location' }) }, showModal () {} }
  const mpx = Object.assign({ config: { webConfig: {} }, use () {}, navigateTo (request) { options.navigation = request } }, api)
  const core = {
    default: mpx,
    createApp: value => { options.value = value; options.kind = 'app' },
    createPage: value => { options.value = value; options.kind = 'page' },
    createComponent: value => { options.value = value; options.kind = 'component' },
    implement () {}
  }
  const modules = {
    '@mpxjs/core': core,
    '@mpxjs/api-proxy': Object.assign({ default: mpx }, api),
    '@mpxjs/pinia': { createPinia: () => ({}), mapState: () => ({}), mapActions: () => ({ loadArticle: id => calls.push({ action: 'loadArticle', id }) }) }
  }
  const context = vm.createContext(Object.assign({ __modules: modules, __mpx_mode__: mode, __options: options, mpx, wx: api }, core))
  let transformed = source
  astOf(source).program.body.slice().reverse().forEach(node => {
    if (node.type !== 'ImportDeclaration') return
    const moduleName = node.source.value
    if (!modules[moduleName]) {
      const useArticleStore = () => ({ loadArticle: id => calls.push({ action: 'loadArticle', id }) })
      modules[moduleName] = /store\/article$/.test(moduleName) ? { default: useArticleStore, useArticleStore } : {}
    }
    const replacement = node.specifiers.map(specifier => {
      const key = specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.imported?.name
      return `const ${specifier.local.name} = __modules[${JSON.stringify(moduleName)}]${key ? `[${JSON.stringify(key)}]` : ''};`
    }).join('\n')
    transformed = transformed.slice(0, node.start) + replacement + transformed.slice(node.end)
  })
  vm.runInContext(transformed, context, { timeout: 500 })
  return { context, options, mpx, calls }
}

function browserReferences (source) {
  const unsafe = []
  function visit (node, parent) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'Identifier' && ['window', 'document', 'navigator'].includes(node.name)) {
      const key = parent && ((parent.type === 'MemberExpression' && parent.property === node && !parent.computed) || ((parent.type === 'ObjectProperty' || parent.type === 'ObjectMethod') && parent.key === node && !parent.computed))
      const typeCheck = parent?.type === 'UnaryExpression' && parent.operator === 'typeof'
      if (!key && !typeCheck) unsafe.push(node.name)
    }
    Object.keys(node).forEach(key => {
      if (['loc', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) return
      const child = node[key]
      if (Array.isArray(child)) child.forEach(value => visit(value, node))
      else if (child && typeof child === 'object') visit(child, node)
    })
  }
  visit(astOf(source), null)
  return unsafe
}

function probe ({ kind, source, mode = 'web', components = [] }) {
  if (kind === 'browser') return { unsafe: browserReferences(source) }
  if (kind === 'template') {
    const compiler = require('@mpxjs/webpack-plugin/lib/template-compiler/compiler')
    const errors = []
    const warnings = []
    const { root } = compiler.parse(source, {
      mode,
      srcMode: 'wx',
      env: '',
      usingComponents: components,
      usingComponentsInfo: {},
      externalClasses: [],
      defs: { __mpx_mode__: mode },
      warn: value => warnings.push(value),
      error: value => errors.push(value),
      proxyComponentEventsRules: []
    })
    return { template: compiler.serialize(root), errors, warnings }
  }
  if (kind === 'config' || kind === 'json') {
    if (kind === 'json') {
      try { return { value: JSON.parse(source) } } catch (_) {}
    }
    const context = vm.createContext({
      module: { exports: {} },
      __mpx_mode__: mode,
      process: { env: { MPX_CLI_MODE: mode, NODE_ENV: 'production' } },
      require: { resolve: name => name }
    })
    vm.runInContext(source, context, { timeout: 500 })
    const value = context.module.exports
    const plugin = value.pluginOptions?.mpx?.plugin
    const samples = plugin?.webConfig?.transRpxFn
      ? ['0', '28', '200', '-8'].map(number => plugin.webConfig.transRpxFn(number + 'rpx', number))
      : null
    const include = plugin?.autoVirtualHostRules?.include
    const virtualHost = include && typeof include.test === 'function'
      ? ['layout-cell', 'red-card'].map(name => include.test('/src/components/' + name + '.mpx'))
      : null
    return { value: JSON.parse(JSON.stringify(value)), samples, virtualHost }
  }
  const { context, options, mpx, calls } = capture(source, mode)
  if (!options.value) return { error: 'No Mpx constructor was called' }
  if (kind === 'script') {
    vm.runInContext('__data = typeof __options.value.data === "function" ? __options.value.data() : __options.value.data', context, { timeout: 500 })
    return { constructor: options.kind, data: context.__data, externalClasses: options.value.externalClasses, webConfig: mpx.config.webConfig }
  }
  if (kind === 'location' || kind === 'navigation') {
    vm.runInContext('__page = Object.assign({}, typeof __options.value.data === \'function\' ? __options.value.data() : __options.value.data, __options.value.methods)', context, { timeout: 500 })
    if (kind === 'location') {
      vm.runInContext('__page.choosePlace()', context, { timeout: 500 })
      return { calls, placeName: context.__page.placeName }
    }
    vm.runInContext('__page.openChoice(); __options.navigation.events.ready()', context, { timeout: 500 })
    const ready = context.__page.selectedLabel === '正在选择'
    const events = Object.keys(options.navigation.events).filter(name => name !== 'ready')
    const confirmed = events.filter(name => {
      context.__eventName = name
      vm.runInContext('__options.navigation.events[__eventName]("probe-choice")', context, { timeout: 500 })
      return context.__page.selectedLabel === 'probe-choice'
    })
    return { ready, confirmed }
  }
  if (kind === 'wxload') {
    vm.runInContext(`
      __page = Object.assign({}, __options.value.data, __options.value.methods)
      __options.value.onLoad.call(__page, { id: 'probe-id' })
    `, context, { timeout: 500 })
    return { loaded: calls.some(call => call.action === 'loadArticle' && call.id === 'probe-id') }
  }
  if (kind === 'state') {
    vm.runInContext(`
      __page = Object.assign({}, typeof __options.value.data === 'function' ? __options.value.data() : __options.value.data, __options.value.methods)
      Object.keys(__options.value.computed || {}).forEach(key => Object.defineProperty(__page, key, { get: __options.value.computed[key].bind(__page) }))
      __page.appliedCategory = 'all'
      __page.openFilter()
      __opened = __page.filterVisible && __page.draftCategory === 'all'
      __page.chooseDraftCategory('home')
      __page.cancelFilter()
      __cancelled = !__page.filterVisible && __page.appliedCategory === 'all'
      __page.openFilter()
      __reset = __page.draftCategory === 'all'
      __page.chooseDraftCategory('home')
      __page.confirmFilter()
      __confirmed = !__page.filterVisible && __page.appliedCategory === 'home' && __page.filteredProducts.length > 0 && __page.filteredProducts.every(item => item.category === 'home')
      __page.openFilter()
      __reopened = __page.draftCategory === 'home'
      __page.chooseDraftCategory('all')
      __page.cancelFilter()
      __retained = __page.appliedCategory === 'home' && !__page.filterVisible
      __page.regionText = 'probe-region'
      __page.selectedStoreName = 'probe-store'
      __page.confirmSelection()
      __store = __page.confirmedText.includes('probe-region') && __page.confirmedText.includes('probe-store')
    `, context, { timeout: 500 })
    return { passed: context.__opened && context.__cancelled && context.__reset && context.__confirmed && context.__reopened && context.__retained && context.__store }
  }
  if (kind === 'video') {
    const VueRouter = require('vue-router')
    const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/pages/business/index' }] })
    const expected = 'https://media.example/video%2Fpart.mp4?signature=a%2Fb%25&next=%3Fv%3D1'
    context.__query = router.resolve('/pages/business/index?videoUrl=' + encodeURIComponent(expected)).route.query
    vm.runInContext(`
      __page = Object.assign({}, typeof __options.value.data === 'function' ? __options.value.data() : __options.value.data, __options.value.methods)
      __options.value.onLoad.call(__page, __query)
    `, context, { timeout: 500 })
    const srcMatches = context.__page.src === expected
    const values = { currentTime: 0, duration: 81, videoWidth: 640, videoHeight: 360 }
    context.__event = { target: values }
    vm.runInContext('__page.onTimeUpdate(__event); __page.onMetadata(__event)', context, { timeout: 500 })
    const fallback = Object.keys(values).every(key => context.__page[key] === values[key])
    context.__event = { detail: { currentTime: 4, duration: 90, width: 1280, height: 720 }, target: {} }
    vm.runInContext('__page.onTimeUpdate(__event); __page.onMetadata(__event)', context, { timeout: 500 })
    const detail = context.__page.currentTime === 4 && context.__page.duration === 90 && context.__page.videoWidth === 1280 && context.__page.videoHeight === 720
    return { srcMatches, fallback, detail, expected, actual: context.__page.src }
  }
  throw new Error(`Unknown probe: ${kind}`)
}

try {
  process.stdout.write(JSON.stringify(probe(JSON.parse(fs.readFileSync(0, 'utf8')))))
} catch (error) {
  process.stdout.write(JSON.stringify({ error: error.message }))
}
