import WebIntersectionObserver from './IntersectionObserver'
import { isBrowser, throwSSRWarning } from '../../../common/js'

function createIntersectionObserver (component, options) {
  if (!isBrowser) {
    throwSSRWarning('createIntersectionObserver API is running in non browser environments')
    return
  }
  return new WebIntersectionObserver(component, options)
}

export {
  createIntersectionObserver
}
