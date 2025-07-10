// 调试 RN 环境下的 genNode 行为
const { parse } = require('./packages/webpack-plugin/lib/template-compiler/compiler')
const genNode = require('./packages/webpack-plugin/lib/template-compiler/gen-node-react')

// 测试模板
const testTemplate = '<scroll-view wx:if="{{false}}" enable-flex="{{true}}">11111</scroll-view>'

// 编译选项
const options = {
  mode: 'ios',
  srcMode: 'wx',
  usingComponentsInfo: {},
  globalComponents: [],
  componentPlaceholder: []
}

console.log('=== 开始测试 ===')
console.log('模板:', testTemplate)
console.log('编译选项:', options)

try {
  const { root } = parse(testTemplate, options)
  console.log('\n=== AST 结构 ===')
  console.log('Root:', JSON.stringify(root, null, 2))

  console.log('\n=== 生成代码 ===')
  const generated = genNode(root)
  console.log('Generated:', generated)

  console.log('\n=== 查看子节点 ===')
  if (root.children && root.children.length > 0) {
    root.children.forEach((child, index) => {
      console.log(`Child ${index}:`, JSON.stringify(child, null, 2))
      console.log(`Child ${index} Generated:`, genNode(child))
    })
  }
} catch (error) {
  console.error('错误:', error)
} 