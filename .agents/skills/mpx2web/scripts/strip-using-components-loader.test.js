'use strict'

const {
  removeUsingComponents
} = require('./strip-using-components-loader')

describe('strip-using-components-loader', () => {
  test('removes usingComponents and preserves sibling JSON fields', () => {
    const source = `<script type="application/json">
{
  "usingComponents": {
    "pay-form": "../components/pay-form/index"
  },
  "navigationBarTitleText": "Payment"
}
</script>`
    const output = removeUsingComponents(source)

    expect(output).toMatch(/"usingComponents"\s*:\s*\{\}/)
    expect(output).not.toContain('../components/pay-form/index')
    expect(output).toContain('"navigationBarTitleText": "Payment"')
  })

  test('removes multiple usingComponents objects', () => {
    const source = `
<script type="application/json">{
  "usingComponents": { "card": "./card" }
}</script>
<script type="application/json">{
  "usingComponents": { "icon": "./icon" }
}</script>`
    const output = removeUsingComponents(source)

    expect(output.match(/"usingComponents"\s*:\s*\{\}/g)).toHaveLength(2)
    expect(output).not.toContain('"./card"')
    expect(output).not.toContain('"./icon"')
  })

  test('leaves source without usingComponents unchanged', () => {
    const source = '<script type="application/json">{ "component": true }</script>'

    expect(removeUsingComponents(source)).toBe(source)
  })
})
