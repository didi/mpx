import { error } from '@mpxjs/utils'
import createApp from './createApp'
import createPage from './createPage'
import createComponent from './createComponent'

export { createApp, createPage, createComponent }

export function pageWrapperHOC (WrappedComponent, pageConfig) {
  if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony') {
    return require('./patch/pageWrapperHOC').pageWrapperHOC(WrappedComponent, pageConfig)
  }
  error('pageWrapperHOC is only supported in React Native.')
}
