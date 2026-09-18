const fs = require('fs'), vm = require('vm'), assert = require('assert/strict')
const source = fs.readFileSync(__dirname + '/../outputs/pages/task-board.mpx', 'utf8')
const code = fs.readFileSync(__dirname + '/grader-compiled.js', 'utf8').replace(/^import .*$/gm, '')
function mount(query = {}) {
 let page, load
 const ctx = { createPage: p => { page = p }, ref: value => ({ value }), computed: f => ({ get value() { return f() } }), onLoad: f => { load = f }, onResize() {}, setTimeout: f => f(), wx: { getSystemInfoSync: () => ({ windowHeight: 640, statusBarHeight: 24 }), getMenuButtonBoundingClientRect: () => ({ top: 30, height: 32 }) } }
 vm.runInNewContext(code, ctx)
 const state = page.setup({}, {})
 load(query)
 return state
}
async function main() {
 const refresh = source.match(/bindrefresherrefresh="(\w+)"/)[1]
 const more = source.match(/bindscrolltolower="(\w+)"/)[1]
 const a = mount()
 await a[refresh](); assert.equal(a.refreshing.value, false)
 const b = mount({ refreshFail: '1' }); const before = b.filteredTasks.value.map(x => x.taskKey).join()
 await b[refresh](); assert.equal(b.refreshing.value, false); assert.ok(b.refreshError.value); assert.equal(b.filteredTasks.value.map(x => x.taskKey).join(), before)
 await b[refresh](); assert.equal(b.refreshError.value, '')
 const keys = a.filteredTasks.value.map(x => x.taskKey).join()
 a[more](); assert.equal(a.filteredTasks.value.length, 5)
 a[more](); assert.equal(a.filteredTasks.value.length, 7); assert.equal(a.filteredTasks.value.slice(0,3).map(x=>x.taskKey).join(), keys)
 const start = source.match(/bindtouchstart="(\w+)"/)[1]
 for(const eventName of ['end', 'cancel']) { a[start]({ currentTarget: { dataset: { category: '工作' } } }); assert.equal(a.pressedCategory.value, '工作'); a[source.match(new RegExp('bindtouch'+eventName+'="(\\w+)"'))[1]](); assert.equal(a.pressedCategory.value, '') }
 console.log('PASS actual Mpx setup compilation; compiled setup return exposes template handlers/state; template-linked refresh resolve/reject/retry; pagination 3→5→7 preserves original keys; touch start/end/cancel state. Mock host/reactivity only; no full application build, WeChat template compilation or device run.')
}
main().catch(e=>{console.error(e);process.exitCode=1})
