const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const { JSDOM, ResourceLoader, VirtualConsole } = require('/Users/didi/work/mpx/node_modules/jest-environment-jsdom/node_modules/jsdom')
const delay = () => new Promise(r => setTimeout(r, 30))
async function check (group) {
  const root = '/tmp/mpx-semantic-profile-' + group + '/dist/web'
  const errors = []
  const console = new VirtualConsole()
  console.on('error', (...args) => errors.push(args.join(' ')))
  console.on('jsdomError', error => errors.push(error.message))
  class Resources extends ResourceLoader {
    fetch (url) { return Promise.resolve(fs.readFileSync(path.join(root, new URL(url).pathname))) }
  }
  const dom = new JSDOM(fs.readFileSync(root + '/index.html', 'utf8'), { url: 'http://profile.test/', resources: new Resources(), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console, beforeParse (window) { window.scrollTo = () => {} } })
  try {
    await new Promise(r => dom.window.addEventListener('load', r))
    await delay()
    const doc = dom.window.document
    const cards = Array.from(doc.querySelectorAll('.profile-card'))
    assert.equal(cards.length, 2)
    assert.equal(cards[0].textContent, 'A')
    assert.equal(cards[1].textContent, 'B')
    const style = el => dom.window.getComputedStyle(el)
    assert.equal(style(doc.querySelector('.warm-title')).color, 'rgb(187, 51, 17)')
    assert.equal(style(doc.querySelector('.cool-title')).color, 'rgb(34, 85, 204)')
    assert.equal(style(doc.querySelector('.warm-title')).padding, '12px')
    assert.equal(style(doc.querySelector('.cool-title')).padding, '12px')
    assert.equal(style(cards[0]).margin, '3px')
    assert.equal(style(cards[1]).margin, '7px')
    cards[0].dispatchEvent(new dom.window.Event('tap', { bubbles: true }))
    await delay()
    assert.equal(cards[0].textContent, 'Asummary-a')
    assert.equal(cards[1].textContent, 'B')
    cards[1].dispatchEvent(new dom.window.Event('tap', { bubbles: true }))
    await delay()
    assert.equal(cards[0].textContent, 'Asummary-a')
    assert.equal(cards[1].textContent, 'Bsummary-b')
    cards[0].dispatchEvent(new dom.window.Event('tap', { bubbles: true }))
    await delay()
    assert.equal(cards[0].textContent, 'A')
    assert.equal(cards[1].textContent, 'Bsummary-b')
    assert.deepEqual(errors, [])
    return {group, passed: true, checks: ['real compiled Web mount','two independently reactive instances','scoped caller accent-class colors and padding','custom-class propagates to component root','title remains visible']}
  } finally { dom.window.close() }
}
Promise.all(['mpx', 'mpx2web'].map(check)).then(r => process.stdout.write(JSON.stringify(r, null, 2)+'\n')).catch(e => { process.stderr.write(e.stack+'\n'); process.exitCode = 1 })
