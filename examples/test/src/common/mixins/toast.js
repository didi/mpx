const noop = () => {}
export default {
  data: {
    modal: {},
    commonWarnText: '',
    modalData: {}
  },
  methods: {
    showToast (title = '请稍后再试', icon = 'none', options = {}) {
      if (this.$refs.warnToast) {
        this.commonWarnText = title
        this.$refs.warnToast.show()
      } else {
        wx.showToast(Object.assign({
          icon,
          title,
          duration: 2000
        }, options))
      }
    },
    showLoading (title = '加载中') {
      wx.showLoading({ title })
    },
    hideToast () {
      wx.hideToast() && wx.hideLoading()
    },
    hideLoading () {
      wx.hideLoading()
    },
    commonErrToast (err) {
      if (err) {
        if (err.handled) {
          this.hideToast()
        } else {
          this.showToast(err.errmsg)
        }
      } else {
        this.showToast('请稍候再试')
      }
    },
    commonErrAlert (err) {
      if (err) {
        if (err.handled) {
          this.hideToast()
        } else {
          if (this.$refs.modal) {
            if (!err.onCancle) {
              err.onCancle = noop
            }
            this.modal = this.modalData = {
              content: err.errmsg,
              ...err
            }
            this.$refs.modal.show()
          } else {
            wx.showModal({
              title: '提示',
              content: err.errmsg || '请稍后再试',
              showCancel: false,
              confirmText: '我知道了'
            })
          }
        }
      }
    }
  }
}
