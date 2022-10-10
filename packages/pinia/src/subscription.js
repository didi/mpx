import {
  getCurrentInstance,
  onUnmounted
} from '@mpxjs/core'

export function addSubscription (
  subscriptions,
  callback,
  detached,
  onCleanup = () => {}
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
