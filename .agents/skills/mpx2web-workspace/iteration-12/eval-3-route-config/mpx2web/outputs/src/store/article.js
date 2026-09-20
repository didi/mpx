import { reactive } from '@mpxjs/core'
import { fetchArticle } from '../services/article'

const requestControls = new WeakMap()
const stores = new WeakMap()
let miniProgramContainer

function createRootState (source) {
  const sourceState = source && source.article
  return reactive({
    article: {
      article: sourceState && sourceState.article ? sourceState.article : null,
      loading: sourceState && typeof sourceState.loading === 'boolean' ? sourceState.loading : true,
      errorText: sourceState && sourceState.errorText ? sourceState.errorText : ''
    }
  })
}

export function createArticleStateContainer () {
  let value = createRootState()
  const state = {}

  Object.defineProperty(state, 'value', {
    enumerable: true,
    get () {
      return value
    },
    set (nextValue) {
      value = createRootState(nextValue)
    }
  })

  return { state }
}

function getContainer (container) {
  if (container) return container
  if (__mpx_mode__ === 'web') {
    throw new Error('Article SSR state container is unavailable')
  }
  if (!miniProgramContainer) {
    miniProgramContainer = createArticleStateContainer()
  }
  return miniProgramContainer
}

function getRequestControl (store) {
  let control = requestControls.get(store)
  if (!control) {
    control = {
      generation: 0,
      pendingId: '',
      pendingPromise: null
    }
    requestControls.set(store, control)
  }
  return control
}

function createArticleStore (container) {
  const store = {
    loadArticle (id) {
      const articleId = id || 'a'
      const control = getRequestControl(this)

      // SSR 注水后的客户端会命中这里，不再重复请求相同文章。
      if (this.article && this.article.id === articleId && !this.loading && !this.errorText) {
        return Promise.resolve(this.article)
      }

      // onLoad 与 serverPrefetch 对同一资源复用进行中的请求。
      if (control.pendingId === articleId && control.pendingPromise) {
        return control.pendingPromise
      }

      const generation = ++control.generation
      this.article = null
      this.loading = true
      this.errorText = ''

      const pendingPromise = fetchArticle(articleId)
        .then(article => {
          if (generation === control.generation) {
            this.article = article
          }
          return article
        })
        .catch(error => {
          if (generation === control.generation) {
            this.errorText = error.message
          }
        })
        .finally(() => {
          if (generation === control.generation) {
            this.loading = false
          }
          if (control.pendingPromise === pendingPromise) {
            control.pendingId = ''
            control.pendingPromise = null
          }
        })

      control.pendingId = articleId
      control.pendingPromise = pendingPromise
      return pendingPromise
    }
  }

  const stateKeys = ['article', 'loading', 'errorText']
  stateKeys.forEach(key => {
    Object.defineProperty(store, key, {
      enumerable: true,
      get () {
        return container.state.value.article[key]
      },
      set (value) {
        container.state.value.article[key] = value
      }
    })
  })

  return store
}

export function useArticleStore (inputContainer) {
  const container = getContainer(inputContainer)
  let store = stores.get(container)
  if (!store) {
    store = createArticleStore(container)
    stores.set(container, store)
  }
  return store
}
