import '@testing-library/jest-dom/extend-expect'
import MpxScroll from '../../src/helper/MpxScroll/index'
import Vue from 'vue/dist/vue.common.prod'

describe('test mpx scroll', () => {
  const domApp = document.createElement('div')
  domApp.setAttribute('id', 'app')
  document.body.appendChild(domApp)

  Vue.options.__mpxPageConfig = {
    enablePullDownRefresh: true,
    disableScroll: false
  }

  const app = new Vue({
    template: `
      <div id="app" class="app">
        <page>
          <div class="pull-down-loading" style="height: 0"></div>
        </page>
      </div>
    `
  })
  app.$mount('#app')

  const ms = new MpxScroll()

  window.scrollTo = jest.fn()
  window.IntersectionObserver = class IntersectionObserver {
    observe () {}
    disconnect () {}
  }

  test('el is a dom', () => {
    expect(ms.el).toEqual(document.querySelector('page'))
  })

  test('regist events and hooks', () => {
    ms.useScroll()
    if (app.$options.__mpxPageConfig.enablePullDownRefresh) {
      ms.usePullDownRefresh()
      ms.hooks.pullingDown.on(app.__mpxPullDownHandler)
      expect(ms.hooks.pullingDown.disposer.length).toEqual(1)
      expect(ms.pullDownEventRegister).toEqual(null)
    } else {
      expect(ms.hooks.pullingDown.disposer.length).toEqual(0)
    }
  })

  test('page destroy', () => {
    ms.destroy()
    expect(ms.hooks.pullingDown.disposer.length).toEqual(0)
  })
})
