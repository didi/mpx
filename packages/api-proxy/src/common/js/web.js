import { isBrowser } from './utils'

function webHandleSuccess (result, success, complete) {
  typeof success === 'function' && success(result)
  typeof complete === 'function' && complete(result)
}

function webHandleFail (result, fail, complete) {
  typeof fail === 'function' && fail(result)
  typeof complete === 'function' && complete(result)
}

function isTabBarPage (url, router) {
  const tabBarPagesMap = global.__tabBarPagesMap
  if (!tabBarPagesMap || !url) return false
  const path = router.match(url, router.history.current).path
  return !!tabBarPagesMap[path.slice(1)]
}

/**
 * Creates a new DOM element with the specified tag, attributes, and children.
 *
 * @param {string} tag - The tag name of the new element.
 * @param {Object.<string, string>} [attrs={}] - An object containing the attributes to set on the new element.
 * @param {Array.<HTMLElement>} [children=[]] - An array of child elements to append to the new element.
 * @returns {HTMLElement} The newly created DOM element.
 */
function createDom (tag, attrs = {}, children = []) {
  const dom = document.createElement(tag)
  Object.keys(attrs).forEach(k => dom.setAttribute(k, attrs[k]))
  children.length && children.forEach(child => dom.appendChild(typeof child === 'string' ? document.createTextNode(child) : child))
  return dom
}

/**
 * 获取弹窗应当挂载的根节点
 * @returns dom
 */
function getRootElement () {
  const page = getCurrentPages().slice(-1)[0]?.$el
  return page || document.body
}

export {
  webHandleSuccess,
  webHandleFail,
  createDom,
  getRootElement,
  isTabBarPage
}
