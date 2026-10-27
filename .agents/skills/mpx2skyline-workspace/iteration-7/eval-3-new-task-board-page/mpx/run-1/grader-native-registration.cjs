const fs = require('fs')
const path = require('path')
const vm = require('vm')
const root = __dirname
function capture (folder, file) {
  const registered = []
  const context = vm.createContext({
    console,
    Component: options => registered.push(options),
    Page: options => registered.push(options),
    App: () => {},
    wx: {}, setTimeout, clearTimeout, setInterval, clearInterval, Promise
  })
  const cache = {}
  function load (filename) {
    if (cache[filename]) return cache[filename].exports
    const module = { exports: {} }
    cache[filename] = module
    const execute = vm.runInContext('(function(require,module,exports){' + fs.readFileSync(filename, 'utf8') + '\n})', context, { filename })
    execute(name => {
      if (!name.startsWith('.')) throw new Error('Unexpected external module: ' + name)
      return load(path.resolve(path.dirname(filename), name))
    }, module, module.exports)
    return module.exports
  }
  load(path.join(root, 'compiled-wx', folder, file))
  return registered.map(options => ({
    keys: Object.keys(options),
    hasData: Object.prototype.hasOwnProperty.call(options, 'data'),
    data: options.data === undefined ? '<undefined>' : options.data,
    hasCreatedHook: typeof options.created === 'function' || !!(options.lifetimes && options.lifetimes.created),
    hasAttachedHook: typeof options.attached === 'function',
    propertyKeys: Object.keys(options.properties || {})
  }))
}
const result = {
  method: 'Execute actual emitted wx webpack entry and bundle in isolated Node VM; stub native Component/Page registration only.',
  segmented: capture('standalone-components', '__validate_1.js'),
  rating: capture('standalone-components', '__validate_0.js'),
  page: capture('page-and-components', '__validate_0.js'),
  boundary: 'No native host template consumption or lifecycle execution. Missing registration data does not prove first native template consumption occurs before attached setup.',
  nativeRenderer: 'not_run'
}
fs.writeFileSync(path.join(root, 'grader-native-registration.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
