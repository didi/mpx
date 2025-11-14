import { createStore } from '@mpxjs/store'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})

export default store
