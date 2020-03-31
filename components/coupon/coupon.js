const proxy = require('../../utils/proxy')

Component({
  data: {
    selected: false
  }
  ,
  properties: {
    info: {
      type: Object,
      default: {}
    }
  }
  ,
  methods: {
    toggleSelect: function () {
      if (this.data.info.valid) {
        proxy.getTimeWithModal(this)
        this.setData({
          selected: !this.data.selected
        })
      }
    }
  }
})
