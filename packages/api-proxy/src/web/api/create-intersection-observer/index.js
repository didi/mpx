import WebIntersectionObserver from './IntersectionObserver'

function createIntersectionObserver (component, options) {
  return new WebIntersectionObserver(component, options)
}

export {
  createIntersectionObserver
}
