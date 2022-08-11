export const MutationType = {
  direct: 'direct', // store.xxx = xxx
  patchObject: 'patchObject', // $patch({})
  patchFunction: 'patchFunction' // $patch(() => {})
}
