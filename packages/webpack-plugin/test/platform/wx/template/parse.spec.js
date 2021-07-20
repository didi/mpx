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

    test('runtime element with slot text in not-runtime component', () => {
      const { root } = baseParse('<my-component>this is slot text</my-component>', {
        usingComponents: ['my-component'],
        runtimeComponents: ['my-component']
      })

      const el = root.children[0].children[0]
      expect(el.text).toBe('this is slot text')
      expect(el).toHaveProperty('slotTarget', '"default"')
    })

    test('runtime element with slot normal element in not-runtime component', () => {
      const { root } = baseParse('<my-component><view slot="before">this before slot</view></my-component>', {
        usingComponents: ['my-component'],
        runtimeComponents: ['my-component']
      })

      const el = root.children[0].children[0]
      expect(el.tag).toBe('view')
      expect(el).toHaveProperty('slotTarget', '"before"')
    })

    test('runtime element with slot runtime element in not-runtime component', () => {
      const { root } = baseParse('<my-component><comp-a></comp-a></my-component>', {
        usingComponents: ['my-component', 'comp-a'],
        runtimeComponents: ['my-component', 'comp-a']
      })

      const el = root.children[0].children[0]
      expect(el.tag).toBe('comp-a')
      expect(el.isRuntimeComponent).toBe(true)
      expect(el.isCustomComponent).toBe(true)
      expect(el).toHaveProperty('slotTarget', '"default"')
    })

    test('runtime element with slot runtime element in not-runtime component', () => {
      const { root } = baseParse(
        '<my-component><comp-a slot="before"></comp-a></my-component>',
        {
          usingComponents: ['my-component', 'comp-a'],
          runtimeComponents: ['my-component', 'comp-a']
        }
      )

      const el = root.children[0].children[0]
      expect(el.tag).toBe('comp-a')
      expect(el.isRuntimeComponent).toBe(true)
      expect(el.isCustomComponent).toBe(true)
      expect(el).toHaveProperty('slotTarget', '"before"')
    })

    test('slot tag with attrsList', () => {
      const { root } = baseParse('<slot name="before"></slot><slot></slot><slot name="after"></slot>')

      const beforeSlot = root.children[0]
      const defaultSlot = root.children[1]
      const afterSlot = root.children[2]

      expect(beforeSlot).toHaveProperty('slotName', '"before"')
      expect(beforeSlot.attrsMap).toStrictEqual({
        name: 'before'
      })
      expect(beforeSlot.attrsList).toStrictEqual([
        {
          name: 'name',
          value: 'before'
        }
      ])

      expect(defaultSlot).toHaveProperty('slotName', '"default"')
      expect(defaultSlot.attrsMap).toStrictEqual({})
      expect(defaultSlot.attrsList).toStrictEqual([])

      expect(afterSlot).toHaveProperty('slotName', '"after"')
      expect(afterSlot.attrsMap).toStrictEqual({
        name: 'after'
      })
      expect(afterSlot.attrsList).toStrictEqual([
        {
          name: 'name',
          value: 'after'
        }
      ])
    })

    test('wx:style in runtime component', () => {
      const { root } = baseParse('<view style="color: red;" wx:style="{{ {fontWeight: \'bolder\', fontSize: \'12px\'} }}"></view>', {
        runtimeCompile: true
      })

      const el = root.children[0]
      expect(el.runtimeCompile).toBe(true)
      expect(el).toHaveProperty('staticStyle', '"color: red;"')
      expect(el).toHaveProperty('style', '({fontWeight: \'bolder\', fontSize: \'12px\'})')
      expect(el.attrsMap).toStrictEqual({
        style: '{{__stringify__.stringifyStyle("color: red;", ({fontWeight: \'bolder\', fontSize: \'12px\'}))}}'
      })
      expect(el.attrsList).toStrictEqual([
        {
          name: 'style',
          value: '{{__stringify__.stringifyStyle("color: red;", ({fontWeight: \'bolder\', fontSize: \'12px\'}))}}'
        }
      ])
    })

    test('static style in runtime component', () => {
      const { root } = baseParse('<view style="color: red;"></view>', {
        runtimeCompile: true
      })

      const el = root.children[0]
      expect(el).toHaveProperty('staticStyle', '"color: red;"')
      expect(el.attrsMap).toStrictEqual({
        style: 'color: red;'
      })
      expect(el.attrsList).toStrictEqual([
        {
          name: 'style',
          value: 'color: red;'
        }
      ])
      expect(el).not.toHaveProperty('style')
    })

    test('wx:show', () => {

    })

    test('wx:class', () => {

    })
  })
})
