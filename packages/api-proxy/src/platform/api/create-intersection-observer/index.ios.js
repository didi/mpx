import IntersectionObserver from './rnIntersectionObserver'

function createIntersectionObserver (comp, opt, intersectionCtx) {
  return new IntersectionObserver(comp, opt, intersectionCtx)
}

export {
  createIntersectionObserver
}
