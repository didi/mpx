import { createSelectorQuery } from '../../src/platform/api/create-selector-query/index.web'
import Vue from 'vue/dist/vue.common.prod'

describe('test create-selector-query', () => {
  let component = null

  beforeAll(() => {
    const domApp = document.createElement('div')
    domApp.setAttribute('id', 'app')
    document.body.appendChild(domApp)

    Vue.component('child', {
      template: `
        <div>
          <div class="class1">child class1</div>
          <div class="class2" data-re='"class2"' style="background-color:red">child class2</div>
          <div class="class2" data-re='"class2"' style="background-color:red">child class2</div>
        </div>
      `,
      mounted () {
        component = this
      }
    })
    const app = new Vue({
      template: `
        <div id="app">
          <div class="class1">app class1</div>
          <child></child>
        </div>
      `
    })
    app.$mount('#app')
  })

  afterAll(() => {
    document.body.lastChild.remove()
  })

  test('should support normal feature', () => {
    const query = createSelectorQuery()
    const cb = jest.fn()

    query.in(component)
    query.selectAll('.class1').boundingClientRect()
    query.selectViewport().scrollOffset()
    query.selectAll('.class2').fields({
      dataset: true,
      size: true,
      computedStyle: ['backgroundColor']
    }, cb)
    query.exec(res => {
      expect(res[0].length).toBe(1)
      expect(res[1].scrollTop).toBe(0)
      expect(res[2].length).toBe(2)
      expect(res[2][0].backgroundColor).toBe('red')
    })
    expect(cb.mock.calls.length).toBe(1)
  })
})
