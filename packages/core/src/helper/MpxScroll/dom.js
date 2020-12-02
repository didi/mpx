export function getOffsetTop (el) {
  let top = el.offsetTop
  let op = el.offsetParent
  while (op) {
    top += op.offsetTop
    op = op.offsetParent
  }
  return top
}

export function getElement (el) {
  return typeof el === 'string'
    ? document.querySelector(el)
    : el
}

export function getScrollTop () {
  return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop
}

export function preventDefault (e, isStopPropagation) {
  if (typeof e.cancelable !== 'boolean' || e.cancelable) {
    e.preventDefault()
  }

  if (isStopPropagation) {
    e.stopPropagation()
  }
}
