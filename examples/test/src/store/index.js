import { createStore } from '@mpxjs/core'
import state from './state'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'

const store = createStore({
  state,
  mutations,
  getters,
  actions
})

export default store
