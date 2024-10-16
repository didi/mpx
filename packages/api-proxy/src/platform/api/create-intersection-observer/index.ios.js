import IntersectionObserver from './rnIntersectionObserver'

function createIntersectionObserver (comp, opt, config) {
  return new IntersectionObserver(comp, opt, config)
}

export {
  createIntersectionObserver
}
