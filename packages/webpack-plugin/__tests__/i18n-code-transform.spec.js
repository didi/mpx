/* eslint-disable no-new-func */

const fs = require('fs')
const path = require('path')

// Execute the actual helper injected into @intlify/core-base.
const source = fs.readFileSync(path.join(__dirname, '../lib/index.js'), 'utf8')
const start = source.indexOf("'function _mpxCodeTransForm (code)")
const end = source.indexOf(',\n              index: ast.end', start)
const helper = new Function('return ' + source.slice(start, end))()
const transform = new Function(helper + '; return _mpxCodeTransForm')()
const ctx = {
  normalize: values => values.join(''),
  interpolate: String,
  named: key => ({ name: 'MPX', count: 2 })[key],
  list: index => ['MPX'][index],
  plural: values => values[2],
  linked: key => ({ 'common.confirm': 'Confirm' })[key],
  type: 'text'
}

test.each([
  ['normalize: _normalize', '_normalize(["你好"])', '你好'],
  ['normalize: _normalize, interpolate: _interpolate, named: _named', '_normalize(["你好，", _interpolate(_named("name"))])', '你好，MPX'],
  ['normalize: _normalize, interpolate: _interpolate, list: _list', '_normalize(["Hello, ", _interpolate(_list(0))])', 'Hello, MPX'],
  ['normalize: _normalize, interpolate: _interpolate, named: _named, plural: _plural', '_plural(["No tickets", "One ticket", _normalize([_interpolate(_named("count")), " tickets"])])', '2 tickets'],
  ['linked: _linked, type: _type', '_linked("common.confirm", undefined, _type)', 'Confirm'],
  ['normalize, interpolate, named', 'normalize(["你好，", interpolate(named("name"))])', '你好，MPX']
])('executes message helpers: %s', (bindings, expression, expected) => {
  const code = `(ctx) => { const { ${bindings} } = ctx; return ${expression} }`
  const message = new Function('return ' + transform(code))()
  expect(message(ctx)).toBe(expected)
})
