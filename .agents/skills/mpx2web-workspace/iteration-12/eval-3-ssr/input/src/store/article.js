import { createStore } from '@mpxjs/core'
import { fetchArticle } from '../services/article'

export default createStore({
  state: { article: null, loading: true, errorText: '' },
  mutations: {
    startLoading (state) {
      state.article = null
      state.loading = true
      state.errorText = ''
    },
    setArticle (state, article) { state.article = article },
    setError (state, message) { state.errorText = message },
    finishLoading (state) { state.loading = false }
  },
  actions: {
    async loadArticle ({ commit }, id) {
      commit('startLoading')
      try {
        const article = await fetchArticle(id)
        commit('setArticle', article)
        return article
      } catch (error) {
        commit('setError', error.message)
      } finally {
        commit('finishLoading')
      }
    }
  }
})
