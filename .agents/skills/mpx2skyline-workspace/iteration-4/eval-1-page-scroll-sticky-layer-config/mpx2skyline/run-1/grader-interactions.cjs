const fs = require('fs')
const vm = require('vm')
const assert = require('assert/strict')
const path = require('path')
async function verify (group) {
 const base = path.resolve('/private/tmp/skyline-v4-baseline/eval-1', group)
 const text = fs.readFileSync(base + '/outputs/orders.mpx', 'utf8')
 const main = text.match(/<scroll-view\b[^>]*refresher-enabled[^>]*>/)[0]
 const event = name => main.match(new RegExp('(?:bind|catch)' + name + '="([^"]+)"'))[1]
 let definition, fail = false
 const calls = []
 const service = fs.readFileSync(base + '/outputs/service.js', 'utf8').replace('export function', 'function')
 const originalFetch = vm.runInNewContext(service + ';fetchOrders')
 vm.runInNewContext(text.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, ''), {createPage: value => {definition=value},fetchOrders: p => {calls.push(p); return fail ? Promise.reject(new Error('injected')) : originalFetch(p)},wx: {getWindowInfo: () => ({windowHeight:800,statusBarHeight:24})}})
 const p=Object.assign({},definition.data,definition.methods,{renderer:'skyline'})
 await p[event('refresherrefresh')]()
 assert.equal(p.sections.length,4); assert.equal(p.refreshing,false)
 const initial=p.sections.slice()
 await p[event('scrolltolower')](); await p[event('scrolltolower')]()
 assert.equal(p.sections.length,12); assert.equal(p.pageNo,3)
 initial.forEach((v,i)=>assert.equal(v,p.sections[i]))
 fail=true
 await p[event('refresherrefresh')]()
 assert.equal(p.refreshing,false); assert.equal(p.sections.length,12)
 fail=false
 await p[event('refresherrefresh')]()
 assert.equal(p.refreshing,false); assert.equal(p.sections.length,4)
 p[event('scroll')]({detail:{scrollTop:137}})
 assert.equal(p.scrollTop,137)
 assert.ok(text.includes('{{scrollTop}}'))
 const result={group,passed:true,sourceBindings:{refresh:event('refresherrefresh'),pagination:event('scrolltolower'),scroll:event('scroll')},requestPages:calls,checks:['actual main binding refresh resolve/reject clears refreshing','two actual bound pagination calls retain initial and append to12 groups page3','bound main scroll updates137 displayed in overview'],limitations:['VM methods with mocked host; no native event dispatch, template compilation or rendering']}
 fs.writeFileSync(base+'/run-1/grader-interactions.json',JSON.stringify(result,null,2)+'\n')
 console.log(JSON.stringify(result))
}
Promise.all(['mpx2skyline','no_skill'].map(verify)).catch(e=>{console.error(e);process.exitCode=1})
