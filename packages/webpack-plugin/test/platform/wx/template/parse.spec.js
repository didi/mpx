const { baseParse } = require('../../util')

describe('compiler: parse', () => {
  describe('Element', () => {
    test('simple element', () => {
      const { root } = baseParse('<view>mpx</view>')
      const el = root.children[0]

      expect(el.tag).toBe('view')
      expect(el.attrsList).toEqual([])
      expect(el.children[0].text).toBe('mpx')
      // expect(element).toStrictEqual({
      //   type: 1,
      //   tag: 'view',
      //   attrsList: [],
      //   attrsMap: {},
      //   parent: root,
      //   children: [],
      //   isCustomComponent: undefined,
      //   isGlobalComponent: undefined,
      //   isRuntimeComponent: undefined,
      //   runtimeCompile: false,
      //   moduleId: undefined,
      //   events: {}
      // })
    })

    test('interpolation in element', () => {
      const { root } = baseParse('<view>{{ msg }}</view>')
      const el = root.children[0]

      expect(el.tag).toBe('view')
      expect(el.attrsList).toEqual([])
      expect(el.children[0].text).toBe('{{ msg }}')
    })
  })

  describe('Runtime Render Element', () => {
    test('runtime elment in not-runtime component', () => {
      const { root } = baseParse('<my-component></my-component>', {
        usingComponents: ['my-component'],
        runtimeComponents: ['my-component']
      })

      const el = root.children[0]
      expect(el.isRuntimeComponent).toBe(true)
      expect(el.isCustomComponent).toBe(true)
    })

    // test('runtime element with slot text in not-runtime component')

    // test('runtime element with slot element in not-runtime component')

    // test('runtime element with slot runtime element in not-runtime component')

    test('runtime element in runtime component', () => {
      const { root } = baseParse('<my-component></my-component>', {
        usingComponents: ['my-component'],
        runtimeComponents: ['my-component'],
        runtimeCompile: true
      })

      const el = root.children[0]
      expect(el.isRuntimeComponent).toBe(true)
      expect(el.isCustomComponent).toBe(true)
      expect(el.runtimeCompile).toBe(true)
    })
  })
})
