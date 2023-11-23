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

// 在H5中，直接绑定 click 可能出现延时问题，很多点击可以关闭的组件被唤出之后，有概率立马触发点击事件，导致组件被关闭。
// 使用该方法通过 touchstart 和 touchend 模拟 click 事件，解决延时问题。
function bindTap (dom, handler) {
  let startTime = 0, x = 0, y = 0
  const touchStart = (e) => {
    startTime = Date.now()
    x = e.touches[0].pageX
    y = e.touches[0].pageY
  }
  const touchEnd = (e) => {
    if (Date.now() - startTime < 300 && Math.abs(e.changedTouches[0].pageX - x) < 10 && Math.abs(e.changedTouches[0].pageY - y) < 10) {
      handler(e)
    }
  }
  dom.addEventListener('touchstart', touchStart)
  dom.addEventListener('touchend', touchEnd)
  return () => {
    dom.removeEventListener('touchstart', touchStart)
    dom.removeEventListener('touchend', touchEnd)
  }
}

/**
 * 获取弹窗应当挂载的根节点
 * @returns dom
 */
function getRootElement() {
  const page = getCurrentPages().slice(-1)[0]?.$el
  return page || document.body
}

export {
  webHandleSuccess,
  webHandleFail,
  createDom,
  bindTap,
  getRootElement,
  isTabBarPage
}
