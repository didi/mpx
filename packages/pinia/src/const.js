export const MutationType = {
  direct: 'direct', // store.xxx = xxx
  patchObject: 'patchObject', // $patch({})
  patchFunction: 'patchFunction' // $patch(() => {})
}

// to avoid warning in vue2, exclude relevant properties
export const propsBlackList = ['$dispose', '$id', '$onAction', '$patch', '$reset', '$subscribe', '_p', '_s', '_hotUpdate', '_r']
