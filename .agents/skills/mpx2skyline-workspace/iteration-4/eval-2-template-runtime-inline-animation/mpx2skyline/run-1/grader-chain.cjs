const fs=require('fs'),vm=require('vm'),assert=require('assert/strict')
for(const group of ['mpx2skyline','no_skill']) {
 const base='/private/tmp/skyline-v4-baseline/eval-2/'+group
 const source=fs.readFileSync(base+'/outputs/user-list.mpx','utf8')
 let options,instance
 const calls=[]
 const query={in(p){assert.equal(p,instance);calls.push('component scope');return this},select(id){calls.push(id);return this},node(){return this},exec(cb){cb([{node:{scrollTo(v){calls.push(v.top)}}}])}}
 vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,''),{createComponent:o=>{options=o},wx:{createSelectorQuery:()=>query,navigateTo:o=>calls.push(o.url)},setInterval:()=>1,clearInterval:()=>{}})
 instance=Object.assign({},options.data,options.methods,{createSelectorQuery:()=>{calls.push('component scope');return query}})
 const button=source.match(/<view[^>]*bindtap="scrollTop"[^>]*>/)[0]
 const handler=e=>button.match(new RegExp('bind'+e+'="([^"]+)"'))[1]
 for(const [event,want] of [['touchstart',true],['touchend',false],['touchstart',true],['touchcancel',false]]) {instance[handler(event)]();assert.equal(instance.pressed,want)}
 instance[handler('tap')]()
 assert.deepEqual(calls,['component scope','#users',0])
 const states=[]
 for(const items of [undefined,null,[],[{id:1,name:'A',visible:true},{id:2,name:'B',visible:false},{id:3,name:'C',visible:true}]]){instance.setRows({items});const rows=options.computed.visibleItems.call(instance);assert.ok(Array.isArray(rows));states.push(rows.map(x=>x.name))}
 instance.openDetail();assert.equal(calls[3],'/pages/detail')
 const result={passed:true,query:calls.slice(0,3),rowsAfterUpdates:states,pressReleaseCancel:true,initialTemplateVisibleItemsIsArray:Array.isArray((options.initData||{}).visibleItems)||Array.isArray(options.data.visibleItems),limitation:'VM/mock update chains; initial template data checked separately before computed, no renderer execution'}
 fs.writeFileSync(base+'/run-1/grader-chain.json',JSON.stringify(result,null,2)+'\n')
 console.log(group,JSON.stringify(result))
}
