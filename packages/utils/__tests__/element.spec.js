import Vue from 'vue'
import { parseSelector, walkChildren } from '../src/element'

const Item = {
  render (h) {
    return h('div')
  }
}

function select (vm, selector, all = false) {
  const result = []
  walkChildren(vm, parseSelector(selector), vm, result, all)
  return all ? result : result[0]
}

describe('Web component selectors', () => {
  let vm

  afterEach(() => {
    vm.$destroy()
  })

  test('matches static and dynamic classes and ids after rendering updates', async () => {
    vm = new Vue({
      data: { active: false, id: 'before' },
      render (h) {
        return h('div', [h(Item, {
          attrs: { id: this.id },
          staticClass: 'static',
          class: ['item spaced', [null, false, { 'active selected': this.active }]]
        })])
      }
    }).$mount()
    const child = vm.$children[0]

    expect(select(vm, '.item')).toBe(child)
    expect(select(vm, '.static.item')).toBe(child)
    expect(select(vm, '.static.item.spaced')).toBe(child)
    expect(select(vm, '#before')).toBe(child)
    expect(select(vm, '.active')).toBeUndefined()

    vm.active = true
    vm.id = 'after'
    expect(select(vm, '#after.active')).toBeUndefined()
    await Vue.nextTick()

    expect(select(vm, '#after.active')).toBe(child)
    expect(select(vm, '.static.item.spaced.active.selected')).toBe(child)
    expect(select(vm, '#before')).toBeUndefined()
    vm.active = false
    await Vue.nextTick()
    expect(select(vm, '.active')).toBeUndefined()
    expect(select(vm, '.selected')).toBeUndefined()
  })

  test.each([true, false])('matches caller ids regardless of DOM attributes with inheritAttrs %p', async (inheritAttrs) => {
    const Child = {
      inheritAttrs,
      render (h) {
        return h('div')
      }
    }
    vm = new Vue({
      data: { id: 'before', active: true },
      render (h) {
        return h('div', [h(Child, {
          attrs: { id: this.id },
          staticClass: 'item',
          class: { active: this.active }
        })])
      }
    }).$mount()
    const child = vm.$children[0]

    child.$el.removeAttribute('id')
    expect(select(vm, '#before')).toBe(child)
    expect(select(vm, '#before.item.active', true)).toEqual([child])
    expect(select(vm, '#before.missing')).toBeUndefined()

    vm.id = 'after'
    vm.active = false
    await Vue.nextTick()

    expect(select(vm, '#before')).toBeUndefined()
    expect(select(vm, '#after.item')).toBe(child)
    expect(select(vm, '#after.active')).toBeUndefined()
    child.$el.id = 'internal'
    expect(select(vm, '#internal')).toBeUndefined()
    expect(select(vm, '#after')).toBe(child)

    child.$el.removeAttribute('id')
    vm.id = undefined
    await Vue.nextTick()
    expect(select(vm, '#after')).toBeUndefined()
  })

  test('excludes the caller even when its root matches the selector', () => {
    vm = new Vue({
      render (h) {
        return h('div', { attrs: { id: 'self' }, class: 'self item' }, [
          h(Item, { class: 'item' })
        ])
      }
    }).$mount()

    expect(select(vm, '#self')).toBeUndefined()
    expect(select(vm, '#self', true)).toEqual([])
    expect(select(vm, '.self')).toBeUndefined()
    expect(select(vm, '.self', true)).toEqual([])
    expect(select(vm, '.item')).toBe(vm.$children[0])
    expect(select(vm, '.item', true)).toEqual([vm.$children[0]])
  })

  test('ignores child root DOM attributes including changes outside the VNode', () => {
    vm = new Vue({
      render (h) {
        return h('div', [h({
          render (h) {
            return h('div', { attrs: { id: 'root' }, class: 'root-class' })
          }
        })])
      }
    }).$mount()
    const child = vm.$children[0]

    expect(select(vm, '#root')).toBeUndefined()
    expect(select(vm, '.root-class')).toBeUndefined()
    child.$el.id = 'updated'
    child.$el.className = 'updated-class'
    expect(select(vm, '#root')).toBeUndefined()
    expect(select(vm, '.root-class')).toBeUndefined()
    expect(select(vm, '#updated')).toBeUndefined()
    expect(select(vm, '.updated-class')).toBeUndefined()
  })

  test('distinguishes components sharing a root DOM node by their caller attributes', () => {
    const Wrapper = {
      render () {
        return this.$slots.default[0]
      }
    }
    vm = new Vue({
      render (h) {
        return h('div', [h(Wrapper, { staticClass: 'wrapper' }, [
          h(Item, { attrs: { id: 'inner' }, staticClass: 'item', class: { active: true } })
        ])])
      }
    }).$mount()
    const wrapper = vm.$children[0]
    const item = wrapper.$children[0]

    expect(wrapper.$el).toBe(item.$el)
    ;['#inner', '.item', '.active', '#inner.item.active'].forEach(selector => {
      expect(select(vm, selector)).toBe(item)
      expect(select(vm, selector, true)).toEqual([item])
    })
    expect(select(vm, '.wrapper')).toBe(wrapper)
    expect(select(vm, '.wrapper', true)).toEqual([wrapper])
    expect(select(vm, '.wrapper.item')).toBeUndefined()
    expect(select(vm, '#inner.wrapper', true)).toEqual([])
  })

  test('matches all conditions in a group and returns the first or all components', () => {
    vm = new Vue({
      render (h) {
        return h('div', [
          h(Item, { class: 'other' }),
          h(Item, { attrs: { id: 'first' }, class: 'item active' }),
          h(Item, { class: 'item' })
        ])
      }
    }).$mount()
    const [, first, second] = vm.$children

    expect(select(vm, '.item')).toBe(first)
    expect(select(vm, '.item', true)).toEqual([first, second])
    expect(select(vm, '.item.active', true)).toEqual([first])
    expect(select(vm, '#missing.item')).toBeUndefined()
    expect(select(vm, '#first.missing')).toBeUndefined()
    expect(select(vm, '.missing')).toBeUndefined()
    expect(select(vm, '#missing,.active')).toBe(first)
  })

  test('excludes template wrappers while retaining ordinary Vue components', () => {
    const template = {
      __mpxTemplate: true,
      render (h) {
        return h('div', { attrs: { id: 'wrapper' }, class: 'item' })
      }
    }
    vm = new Vue({
      render (h) {
        return h('div', [
          h(template, { attrs: { id: 'wrapper' }, class: 'item' }),
          h(Item, { class: 'item' })
        ])
      }
    }).$mount()

    expect(select(vm, '.item')).toBe(vm.$children[1])
    expect(select(vm, '.item', true)).toEqual([vm.$children[1]])
    expect(select(vm, '#wrapper')).toBeUndefined()
    expect(select(vm, '#wrapper', true)).toEqual([])
  })

  test('selects an initially hidden component and opens it through its instance', async () => {
    const Dialog = {
      data () {
        return { visible: false }
      },
      methods: {
        open () {
          this.visible = true
        }
      },
      render (h) {
        return this.visible ? h('div', 'dialog content') : h()
      }
    }
    vm = new Vue({
      render (h) {
        return h('div', [h(Dialog, { attrs: { id: 'dialog' }, class: 'dialog' })])
      }
    }).$mount()
    const child = vm.$children[0]

    expect(child.$el.nodeType).toBe(8)
    expect(select(vm, '#dialog')).toBe(child)
    expect(select(vm, '.dialog', true)).toEqual([child])

    select(vm, '#dialog').open()
    await Vue.nextTick()

    expect(child.$el.nodeType).toBe(1)
    expect(child.$el.textContent).toBe('dialog content')
    expect(select(vm, '#dialog')).toBe(child)
    expect(select(vm, '.dialog', true)).toEqual([child])
  })

  test('skips built-in components and other component contexts', () => {
    vm = new Vue({
      render (h) {
        return h('div', [
          h({
            __mpxBuiltIn: true,
            render (h) {
              return h('div', this.$slots.default)
            }
          }, { class: 'item' }, [h(Item, { class: 'item' })]),
          h({
            render (h) {
              return h('div', [h(Item, { class: 'item' })])
            }
          })
        ])
      }
    }).$mount()

    expect(select(vm, '.item', true)).toEqual([vm.$children[0].$children[0]])
  })
})
