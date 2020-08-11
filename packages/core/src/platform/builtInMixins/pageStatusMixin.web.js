export default function pageStatusMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      activated () {
        this.onShow && this.onShow()
      },
      deactivated () {
        this.onHide && this.onHide()
      }
    }
  }
}
