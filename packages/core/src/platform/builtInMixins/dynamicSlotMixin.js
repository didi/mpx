export default function dynamicSlotMixin () {
  if (__mpx_mode__ === 'ali') {
    return {
      props: { slots: { type: Object } }
    }
  } else {
    return {
      properties: { slots: { type: Object } }
    }
  }
}
