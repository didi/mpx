const fs = require('fs')
const path = require('path')
const postcss = require('/Users/hjw/project/mpx/node_modules/postcss')
const source = fs.readFileSync(path.join(__dirname, '../outputs/data-panel.mpx'), 'utf8')
const css = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)[1])
const declarations = {}
css.walkRules(rule => {
  declarations[rule.selector] = {}
  rule.walkDecls(decl => { declarations[rule.selector][decl.prop] = decl.value })
})
test('layout uses explicit parent inset, content box width and single sided gap', () => {
  expect(declarations['.outer']['padding-top']).toBe('20px')
  expect(declarations['.child']['margin-top']).toBeUndefined()
  expect(declarations['.child']['box-sizing']).toBe('content-box')
  expect(parseInt(declarations['.child'].width) + 2 * parseInt(declarations['.child'].padding)).toBe(120)
  expect(declarations['.first']['margin-bottom']).toBe('16px')
  expect(declarations['.second']).toBeUndefined()
})
test('effects preserve both layers and order with one effect per node', () => {
  expect(declarations['.many-outer']['box-shadow']).toBe('0 4px 8px #333')
  expect(declarations['.many']['box-shadow']).toBe('0 2px 4px #000')
  expect(source).toContain('<view class="many-outer"><view class="many">')
  expect(source).toContain('<view class="filters"><view class="filters-blur">')
  expect(declarations['.filters'].filter).toBe('brightness(.8)')
  expect(declarations['.filters-blur'].filter).toBe('blur(2px)')
  css.walkDecls('box-shadow', decl => expect(postcss.list.comma(decl.value)).toHaveLength(1))
  css.walkDecls('filter', decl => expect(decl.value.match(/[a-z-]+\(/g)).toHaveLength(1))
})
test('both native navigation targets remain and only contain text', () => {
  const links = [...source.matchAll(/<navigator url="([^"]+)">([\s\S]*?)<\/navigator>/g)]
  expect(links).toHaveLength(2)
  links.forEach(link => {
    expect(link[1]).toBe('/pages/detail')
    expect(link[2]).toMatch(/^<text>[^<]+<\/text>$/)
  })
})
test('fonts and resource path are unchanged', () => {
  expect(source).toContain("src: url('./city.woff2')")
  expect(declarations['.font-a']).toEqual({ 'font-family': "'City-Semibold'", 'font-weight': '600' })
  expect(declarations['.font-b']).toEqual({ 'font-family': "'Trip-Medium'", 'font-weight': '500' })
  expect(JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])).toEqual({ component: true })
})
