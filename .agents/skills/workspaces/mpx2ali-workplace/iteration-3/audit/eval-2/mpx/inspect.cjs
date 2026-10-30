const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const crypto = require('crypto')
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8')
const wx = JSON.parse(read('compiled-wx/fixed-page.json'))
const ali = JSON.parse(read('compiled-ali/fixed-page.json'))
assert.deepEqual(wx, {
  navigationStyle: 'custom',
  enablePullDownRefresh: false,
  usingComponents: { 'info-badge': '/components/info-badgee3dbf562/index' },
  disableScroll: true
})
assert.deepEqual(ali, {
  usingComponents: { 'info-badge': '/components/info-badgee3dbf562/index' },
  allowsBounceVertical: 'NO',
  pullRefresh: false,
  defaultTitle: '',
  transparentTitle: 'always',
  titlePenetrate: 'YES'
})
const axml = read('compiled-ali/fixed-page.axml')
assert.match(axml, /a:for="{{orders}}"/)
assert.match(axml, /a:key="id"/)
assert.match(axml, /onTap="completeOrders"/)
assert.doesNotMatch(axml, /wx:|bindtap=/)
assert.match(axml, /<info-badge/)
assert.match(axml, /height: pageHeight \+ "px"/)
assert.match(axml, /paddingTop: statusBarHeight \+ "px"/)
assert.match(axml, /paddingBottom: safeBottom \+ "px"/)
assert.match(read('compiled-wx/fixed-page.wxml'), /wx:for="{{orders}}"/)
assert.match(read('compiled-wx/fixed-page.wxml'), /bindtap="completeOrders"/)
assert.match(read('compiled-ali/fixed-page.acss'), /position:\s*fixed/)
assert.doesNotMatch(read('compiled-wx/fixed-page.wxss'), /position:\s*fixed/)
;['wx', 'ali'].forEach(mode => {
  const report = JSON.parse(read('app-stats-' + mode + '.json'))
  assert.equal(report.errors.length, 0)
  assert.equal(report.warnings.length, 0)
  assert.match(JSON.stringify(report.modules), /packages\/webpack-plugin\/lib\/template-compiler\/index.js/)
  assert.match(JSON.stringify(report.modules), /packages\/core\/src/)
  assert.equal(JSON.parse(read('compiled-' + mode + '/components/info-badgee3dbf562/index.json')).component, true)
})
assert.equal(JSON.parse(read('dependencies.json')).dependencies['@mpxjs/api-proxy'].entry, require('path').resolve(__dirname, '../../../../../node_modules/@mpxjs/api-proxy/src/index.js'))
;['components/info-badge.mpx', 'utils/window-info.js'].forEach(relative => {
  const output = fs.readFileSync(path.join(__dirname, '..', relative))
  const input = fs.readFileSync(path.resolve(__dirname, '../../../input', relative))
  assert.equal(Buffer.compare(output, input), 0)
  console.log('Unchanged dependency SHA256 ' + relative + ': ' + crypto.createHash('sha256').update(output).digest('hex'))
})
console.log('PASS: emitted navigation JSON, transformed templates, scoped/fixed styles, local source modules and preserved dependencies')
