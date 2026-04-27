const {
  compileTemplateFragment,
  wrapCreateTemplateComponentWithBlock
} = require('../../lib/web/compile-wx-template-fragment')

describe('compileTemplateFragment (wxml template → vue/compiler-sfc)', () => {
  it('returns block with var render / staticRenderFns from compileTemplate', () => {
    const compiled = compileTemplateFragment('<div class="a">x</div>', {
      definitionName: 't1',
      resourcePath: 'a.wxml'
    })
    expect(compiled.block).toContain('var render = function render()')
    expect(compiled.block).toContain('var staticRenderFns')
    expect(compiled.block).toContain('render._withStripped = true')
  })

  it('calls emitError and throws on invalid wxml template fragment (e.g. multi-root)', () => {
    const emitError = jest.fn()
    expect(() =>
      compileTemplateFragment('<div></div><div></div>', { emitError, definitionName: 'bad' })
    ).toThrow()
    expect(emitError).toHaveBeenCalled()
  })

  it('wrapCreateTemplateComponentWithBlock wires render from block into createTemplateComponent', () => {
    const compiled = compileTemplateFragment('<div/>', { definitionName: 'x' })
    const wrapped = wrapCreateTemplateComponentWithBlock(compiled.block, 'name: "mpx-tpl-x"')
    expect(wrapped).toContain('createTemplateComponent({ render, staticRenderFns, name: "mpx-tpl-x" })')
  })
})
