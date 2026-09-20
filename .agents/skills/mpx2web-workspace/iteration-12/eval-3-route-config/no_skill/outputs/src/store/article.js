import { createStore } from '@mpxjs/core'
import { fetchArticle } from '../services/article'

function cloneArticle (article) {
  return article ? Object.assign({}, article) : null
}

function createInitialState (initialState) {
  const source = initialState || {}
  return {
    article: cloneArticle(source.article),
    loading: source.loading === true,
    errorText: typeof source.errorText === 'string' ? source.errorText : ''
  }
}

export function createArticleStore (initialState) {
  // 这些控制量与 state 都在工厂闭包中，SSR 请求间没有可变共享数据。
  let requestVersion = 0
  let pendingRequest = null

  return createStore({
    state: createInitialState(initialState),
    mutations: {
      startLoading (state) {
        state.article = null
        state.loading = true
        state.errorText = ''
      },
      setArticle (state, article) {
        state.article = article
        state.errorText = ''
      },
      setError (state, message) {
        state.article = null
        state.errorText = message
      },
      finishLoading (state) {
        state.loading = false
      }
    },
    actions: {
      loadArticle ({ state, commit }, rawId) {
        const id = typeof rawId === 'string' && rawId ? rawId : 'a'

        if (!state.loading && !state.errorText && state.article && state.article.id === id) {
          return Promise.resolve(state.article)
        }
        if (pendingRequest && pendingRequest.id === id) return pendingRequest.promise

        const version = ++requestVersion
        commit('startLoading')

        const promise = fetchArticle(id).then((article) => {
          if (version === requestVersion) commit('setArticle', article)
          return article
        }).catch((error) => {
          if (version === requestVersion) {
            commit('setError', error && error.message ? error.message : '文章加载失败')
          }
          return null
        }).then((article) => {
          if (version === requestVersion) commit('finishLoading')
          if (pendingRequest && pendingRequest.version === version) pendingRequest = null
          return article
        })

        pendingRequest = { id, version, promise }
        return promise
      }
    }
  })
}

export function serializeArticleState (store) {
  const state = store && store.state
  if (!state) return createInitialState()
  return {
    article: cloneArticle(state.article),
    loading: state.loading === true,
    errorText: typeof state.errorText === 'string' ? state.errorText : ''
  }
}
