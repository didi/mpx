import { getCurrentInstance, onUnmounted } from '../core/proxy'
import { noop } from '../helper/utils'

export function addSubscription (
  subscriptions,
  callback,
  detached,
  onCleanup = noop
) {
  subscriptions.push(callback)
  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback)
    if (idx > -1) {
      subscriptions.splice(idx, 1)
      onCleanup()
    }
  }
  if (!detached && getCurrentInstance()) {
    onUnmounted(removeSubscription)
  }
  return removeSubscription
}

export function triggerSubscriptions (subscriptions, ...args) {
  subscriptions.slice().forEach((callback) => {
    // eslint-disable-next-line
    callback(...args)
  })
}
