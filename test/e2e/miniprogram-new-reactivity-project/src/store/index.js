import { createStore } from '@mpxjs/core'

export const storeC = createStore({
  state: {
    countC: 10
  },
  mutations: {
    incrementC (state) {
      state.countC++
    }
  }
})

debugger
export const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  },
  getters: {
    getterCount (state) {
      return state.count
    }
  },
  actions: {
    increment ({ commit }) {
      // storeC内部也可以通过命名空间路径的方式提交 storeB 的 mutation
      commit('increment')
    }
  },
  //   modules: {
  //     moduleB: {
  //       state: {
  //         countB: 1
  //       },
  //       mutations: {
  //         incrementB (state) {
  //           state.countB++
  //         }
  //       }
  //     }
  //   }
  deps: {
    storeC
  }
})
