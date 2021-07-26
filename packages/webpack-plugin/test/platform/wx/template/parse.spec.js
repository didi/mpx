const { baseParse } = require('../../util')

describe('compiler: parse', () => {
  describe('Element', () => {
    test('simple element', () => {
      const { root } = baseParse('<view>mpx</view>')
      const el = root.children[0]

      expect(el.tag).toBe('view')
      expect(el.attrsList).toEqual([])
      expect(el.children[0].text).toBe('mpx')
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
      expect(el).toHaveProperty('mpxPageStatus', true)
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

    describe('wx:show', () => {
      test('wx:show using by normal element', () => {
        const { root } = baseParse('<view wx:show="{{ flag }}"></view>', {
          runtimeCompile: true
        })
  
        const el = root.children[0]
        expect(el.attrsMap).toStrictEqual({
          style: '{{(flag)||(flag)===undefined?\'\':\'display:none;\'}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'style',
            value: '{{(flag)||(flag)===undefined?\'\':\'display:none;\'}}'
          }
        ])
        expect(el).toHaveProperty('showStyle', '(flag)||(flag)===undefined?{}:{display:"none"}')
      })
  
      test('wx:show using by root custom component', () => {
        const { root } = baseParse('<my-component></my-component>', {
          usingComponents: ['my-component'],
          isComponent: true
        })
  
        const el = root.children[0]
        expect(el).toHaveProperty('show', 'mpxShow')
        expect(el.attrsMap).toMatchObject({
          mpxShow: '{{mpxShow}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'mpxShow',
            value: '{{mpxShow}}'
          },
          {
            name: 'mpxPageStatus',
            value: '{{mpxPageStatus}}'
          }
        ])
      })
  
      test('wx:show using by root custom component with directive', () => {
        const { root } = baseParse('<my-component wx:show="{{ flag }}"></my-component>', {
          usingComponents: ['my-component'],
          isComponent: true
        })
  
        const el = root.children[0]
        expect(el).toHaveProperty('show', '(flag)&&mpxShow')
        expect(el.attrsMap).toStrictEqual({
          mpxShow: '{{(flag)&&mpxShow}}',
          mpxPageStatus: '{{mpxPageStatus}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'mpxShow',
            value: '{{(flag)&&mpxShow}}'
          },
          {
            name: 'mpxPageStatus',
            value: '{{mpxPageStatus}}'
          }
        ])
      })
  
      test('wx:show using by custom component', () => {
        const { root } = baseParse('<my-component wx:show="{{ flag }}"></my-component>', {
          runtimeCompile: true,
          usingComponents: ['my-component']
        })
  
        const el = root.children[0]
        expect(el).toHaveProperty('show', '(flag)')
        expect(el).toHaveProperty('mpxPageStatus', true)
        expect(el.attrsMap).toStrictEqual({
          mpxShow: '{{ flag }}',
          mpxPageStatus: '{{mpxPageStatus}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'mpxShow',
            value: '{{ flag }}'
          },
          {
            name: 'mpxPageStatus',
            value: '{{mpxPageStatus}}'
          }
        ])
      })
  
      test('wx:show using with string', () => {
        // in page using wx:show
        const { root } = baseParse('<my-component wx:show=""></my-component>', {
          usingComponents: ['my-component']
        })
  
        const el = root.children[0]
        expect(el).toHaveProperty('show', 'false')
        expect(el.attrsMap).toStrictEqual({
          mpxShow: '{{false}}',
          mpxPageStatus: '{{mpxPageStatus}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'mpxShow',
            value: '{{false}}'
          },
          {
            name: 'mpxPageStatus',
            value: '{{mpxPageStatus}}'
          }
        ])
      })
    })

    describe('wx:class', () => {
      test('only static class', () => {
        const { root } = baseParse('<view class="cls"></view>', {
          runtimeCompile: true
        })

        const el = root.children[0]
        expect(el).toHaveProperty('staticClass', '"cls"')
        expect(el).not.toHaveProperty('class')
        expect(el.attrsList).toStrictEqual([
          {
            name: 'class',
            value: 'cls'
          }
        ])
        expect(el.attrsMap).toStrictEqual({
          class: 'cls'
        })
      })

      test('wx:class using by normal element', () => {
        const { root } = baseParse('<view wx:class="{{ flag }}"></view>', {
          runtimeCompile: true
        })

        const el = root.children[0]
        expect(el).toHaveProperty('class', 'flag')
        expect(el).toHaveProperty('staticClass', '""')
        expect(el.attrsMap).toStrictEqual({
          class: '{{__stringify__.stringifyClass("", flag)}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'class',
            value: '{{__stringify__.stringifyClass("", flag)}}'
          }
        ])
      })

      test('wx:class using by normal element with static class', () => {
        const { root } = baseParse('<view class="cls" wx:class="{{ flag }}"></view>', {
          runtimeCompile: true
        })

        const el = root.children[0]
        expect(el).toHaveProperty('class', 'flag')
        expect(el).toHaveProperty('staticClass', '"cls"')
        expect(el.attrsMap).toStrictEqual({
          class: '{{__stringify__.stringifyClass("cls", flag)}}'
        })
        expect(el.attrsList).toStrictEqual([
          {
            name: 'class',
            value: '{{__stringify__.stringifyClass("cls", flag)}}'
          }
        ])
      })
    })
    
    describe('bind events', () => {})
  })
})
