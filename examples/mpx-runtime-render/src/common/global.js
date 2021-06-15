let uid = 0

export const getUid = function() {
  return ++uid
}

export const methodsCacheMap = new Map()

methodsCacheMap.set('onClick1', function() {
  console.log('onClick1')
})

export const bindMethodsForElement = function(instance) {
  if (methodsCacheMap.size > 0) {
    methodsCacheMap.forEach((methodFn, methodName) => {
      if (!instance[methodName]) {
        instance[methodName] = methodFn
      }
    })
  }
}
