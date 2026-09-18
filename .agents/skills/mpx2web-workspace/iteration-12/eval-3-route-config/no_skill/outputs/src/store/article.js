import { createStore } from '@mpxjs/core'
import { fetchArticle } from '../services/article'

export default createStore({
  state: {
    article: null,
    loading: true,
    errorText: '',
    requestedId: ''
  },
  mutations: {
    startLoading (state, id) {
      state.article = null
      state.loading = true
      state.errorText = ''
      state.requestedId = id
    },
    setArticle (state, article) { state.article = article },
    setError (state, message) { state.errorText = message },
    finishLoading (state) { state.loading = false }
  },
  actions: {
    async loadArticle ({ state, commit }, id) {
      // Mpx hydrates createStore state from window.__INITIAL_STATE__ before
      // mounting. A matching completed result therefore needs no client fetch.
      if (__mpx_mode__ === 'web' && !state.loading && state.requestedId === id) {
        return state.article || undefined
      }

      commit('startLoading', id)
      try {
        const article = await fetchArticle(id)
        // Ignore a stale completion if navigation requested another article.
        if (state.requestedId === id) commit('setArticle', article)
        return article
      } catch (error) {
        if (state.requestedId === id) commit('setError', error.message)
      } finally {
        if (state.requestedId === id) commit('finishLoading')
      }
    }
  }
})
