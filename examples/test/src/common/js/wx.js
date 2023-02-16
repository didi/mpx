import mpx from '@mpxjs/core'

export const wxMessage = (tmplIds, cb = {}) => {
  if (!tmplIds || !tmplIds.length) return
  const successHandle = cb.success
  const completeHandle = cb.complete
  mpx.requestSubscribeMessage({
    tmplIds: tmplIds,
    success (res) {
      successHandle && successHandle(res)
    },
    complete (res) {
      completeHandle && completeHandle(res)
    }
  })
}
