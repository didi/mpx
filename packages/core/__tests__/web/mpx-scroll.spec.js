import '@testing-library/jest-dom/extend-expect'
import { MpxScroll } from '../../src/platform/builtInMixins/pageScrollMixin'
import Vue from 'vue/dist/vue.common.prod'

describe('test mpx scroll', () => {
  const domApp = document.createElement('div')
  domApp.setAttribute('id', 'app')
  document.body.appendChild(domApp)

  Vue.component('child', {
    template: `
      <div class="page"></div>
    `
  })

  Vue.options.__mpxPageConfig = {
    enablePullDownRefresh: true,
    disableScroll: false
  }

  const app = new Vue({
    template: `
      <div id="app" class="app">
        <keep-alive>
          <child></child>
        </keep-alive>
      </div>
    `
  })
  app.$mount('#app')

  const ms = new MpxScroll('.page', {
    pullDownRefresh: {
      threshold: 60
    }
  })

  ms.screen.scrollTo = jest.fn()

  test('el is a dom', () => {
    expect(ms.el).toEqual(document.querySelector('.page'))
  })

  test('pull down is stopped after 3s', done => {
    ms.startPullDownRefresh()
    setTimeout(() => {
      expect(ms.el.style.transition).toEqual('')
      // expect(typeof ms.screen).toEqual('function')
      done()
    }, 3000)
  })

  // test('stopPullDownRefresh', done => {
  //   ms.startPullDownRefresh()
  //   setTimeout(() => {
  //     ms.stopPullDownRefresh()
  //     expect(ms.el.style.transition).toEqual('')
  //     done()
  //   }, 1000)
  // })

  test('event emitter', () => {
    if (app.$options.__mpxPageConfig.enablePullDownRefresh) {
      ms.enablePullDownRefresh()
      ms.hooks.on('pullingDown', app.__mpxPullDownHandler)
      expect(ms.hooks.events.pullingDown.length).toEqual(1)
    }
  })
})
