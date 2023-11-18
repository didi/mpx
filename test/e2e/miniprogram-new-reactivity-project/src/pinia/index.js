import { defineStore } from '@mpxjs/pinia'

export const useOptionsStore = defineStore('options', {
  state: () => {
    return {
      count: 0,
      name: 'pinia'
    }
  },
  getters: {
    myName (state) {
      return state.name
    }
  },
  actions: {
    piniaIncrement () {
      this.$patch((state) => {
        state.count++
      })
    }
  }
})