const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const vm = require('vm')
const assert = require('assert')
const run = __dirname
const root = path.resolve(run, '../../../..')
const input = path.resolve(run, '../outputs/user-list.mpx')
const source = fs.readFileSync(input, 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const checks = []
;['webview', 'skyline'].forEach(renderer => {
  let options
  const navigation = []
  vm.runInNewContext(script, { createComponent: value => { options = value }, wx: { navigateTo: arg => navigation.push(arg) } })
  const instance = Object.assign({ renderer }, JSON.parse(JSON.stringify(options.data)), options.methods)
  assert(Array.isArray(options.initData.visibleItems))
  ;[undefined, null, [], [{id:1,name:'隐藏',visible:false},{id:2,name:'甲',visible:true},{id:3,name:'乙',visible:true}]].forEach(items => {
    instance.setRows({items})
    const result = options.computed.visibleItems.call(instance)
    assert(Array.isArray(result))
    checks.push({renderer, input: items === undefined ? 'undefined' : items, rows: result.map((item,index)=>`${index}:${item.name}`)})
  })
  const calls = []
  const context = { scrollTo: arg => calls.push(arg) }
  const query = { select: id => { assert.equal(id, '#users'); return query }, node: () => query, exec: cb => cb([{node:context}]) }
  instance.createSelectorQuery = () => query
  const button = source.match(/<view class="button"[^>]*>/)[0]
  const fire = name => instance[button.match(new RegExp(name+'="([^"]+)"'))[1]]()
  fire('bindtouchstart'); assert.equal(instance.pressed,true)
  fire('bindtouchend'); assert.equal(instance.pressed,false)
  fire('bindtouchstart'); fire('bindtouchcancel'); assert.equal(instance.pressed,false)
  fire('bindtap'); assert.equal(calls.length,1); assert.equal(calls[0].top,0)
  instance.openDetail(); assert.equal(navigation[0].url,'/pages/detail')
  const expressions = [...source.matchAll(/wx:class="\{\{([\s\S]*?)\}\}"/g)].map(m=>vm.runInNewContext('('+m[1]+')',instance))
  assert.equal(expressions[0]['title-skyline'],renderer==='skyline')
  assert.equal(expressions[0].truncate,renderer!=='skyline')
  assert.equal(expressions[1]['logo-inline'],renderer==='skyline')
})
fs.writeFileSync(path.join(run,'grader-mock.json'),JSON.stringify({passed:true,checks,boundary:'VM + static source bindings; no WeChat layout/host execution'},null,2)+'\n')
const compile = require(path.join(root,'iteration-8/skill-snapshots/mpx/scripts/compile-validate.js'))
compile(input,{target:'wx',type:'component',projectRoot:root,cleanup:false}).then(result=>{
  fs.writeFileSync(path.join(run,'grader-compile-result.json'),JSON.stringify(result,null,2)+'\n')
  const outDir=path.join(os.tmpdir(),'mpx-compile-validate',crypto.createHash('md5').update(input+'|wx|'+process.pid).digest('hex'))
  fs.cpSync(outDir,path.join(run,'grader-compile-artifacts'),{recursive:true})
  assert(result.success)
  console.log(JSON.stringify({mock:'pass',compile:result.success,artifactDir:path.join(run,'grader-compile-artifacts')}))
}).catch(error=>{console.error(error);process.exitCode=1})
