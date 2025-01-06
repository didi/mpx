<template>
  <iframe ref="mpxIframe" class="mpx-iframe" :src="currentUrl" :key="currentUrl"></iframe>
</template>

<script>
import { getCustomEvent } from './getInnerListeners'
import { promisify, redirectTo, navigateTo, navigateBack, reLaunch, switchTab } from '@mpxjs/api-proxy'
import { extend, isFunction } from '@mpxjs/utils'

const navObj = promisify({ redirectTo, navigateTo, navigateBack, reLaunch, switchTab })
const eventLoad = 'load'
const eventError = 'error'
const eventMessage = 'message'
const mpx = global.__mpx
export default {
  props: {
    src: {
      type: String
    }
  },
  computed: {
    host () {
      let host = this.src.split('/')
      if (host[2]) {
        host = host[0] + '//' + host[2]
      } else {
        host = ''
      }
      return host
    },
    currentUrl () {
      if (!this.src) return ''
      const hostValidate = this.hostValidate(this.host)
      if (!hostValidate) {
        console.error('访问页面域名不符合domainWhiteLists白名单配置，请确认是否正确配置该域名白名单')
        return ''
      }
      let src
      const srcQueryIndex = this.src.indexOf('?')
      // webview与被打开页面通过_uid确定关联关系
      if (srcQueryIndex > -1) {
        src = `${this.src.substring(0, srcQueryIndex + 1)}mpx_webview_id=${this._uid}&${this.src.substring(srcQueryIndex + 1)}`
      } else {
        src = `${this.src}?mpx_webview_id=${this._uid}`
      }
      return src
    },
    loadData () {
      return {
        src: this.host,
        fullUrl: this.src
      }
    }
  },
  watch: {
    currentUrl: {
      handler (value) {
        if (!value) {
          this.$emit(eventError, getCustomEvent(eventError, extend({
            errMsg: 'web-view load failed due to not in domain list'
          }, this.loadData), this))
        } else {
          this.$nextTick(() => {
            if (this.$refs.mpxIframe && this.mpxIframe != this.$refs.mpxIframe) {
              this.mpxIframe = this.$refs.mpxIframe
              this.mpxIframe.addEventListener('load', () => {
                this.$emit(eventLoad, getCustomEvent(eventLoad, this.loadData, this))
              })
            }
          })
        }
      },
      immediate: true
    }
  },
  beforeCreate () {
    this.messageList = []
  },
  mounted () {
    window.addEventListener('message', this.messageCallback)
  },
  deactivated () {
    if (!this.messageList.length) {
      return
    }
    let data = {
      type: 'message',
      data: this.messageList
    }
    this.$emit(eventMessage, getCustomEvent(eventMessage, data, this))
  },
  destroyed () {
    window.removeEventListener('message', this.messageCallback)
    if (!this.messageList.length) {
      return
    }
    let data = {
      type: 'message',
      data: this.messageList
    }
    this.$emit(eventMessage, getCustomEvent(eventMessage, data, this))
  },
  methods: {
    messageCallback (event) {
      const hostValidate = this.hostValidate(event.origin)
      let data = {}
      try {
        const eventData = event.data
        data = typeof eventData === 'string' ? JSON.parse(eventData) : eventData
      } catch(e){}
      // 判断number类型，防止undefined导致触发return逻辑
      if (data.clientUid !== undefined && +data.clientUid !== this._uid) {
        return
      }
      let value = data.payload
      const args = data.args
      const params = Array.isArray(args) ? args : [value]
      if (!hostValidate) {
        return
      }
      let asyncCallback = null
      const type = data.type
      switch (type) {
        case 'postMessage':
          let data = {
            type: 'message',
            data: params[0]?.data
          }
          this.$emit(eventMessage, getCustomEvent(eventMessage, data, this))
          asyncCallback = Promise.resolve({
            errMsg: 'invokeWebappApi:ok'
          })
          break
        case 'navigateTo':
          asyncCallback = navObj.navigateTo(...params)
          break
        case 'navigateBack':
          asyncCallback = navObj.navigateBack(...params)
          break
        case 'redirectTo':
          asyncCallback = navObj.redirectTo(...params)
          break
        case 'switchTab':
          asyncCallback = navObj.switchTab(...params)
          break
        case 'reLaunch':
          asyncCallback = navObj.reLaunch(...params)
          break
        default:
          if (type) {
            const implement = mpx.config.webviewConfig.apiImplementations && mpx.config.webviewConfig.apiImplementations[type]
            if (isFunction(implement)) {
              asyncCallback = Promise.resolve(implement(...params))
            } else {
              asyncCallback = Promise.reject({
                errMsg: `未在apiImplementations中配置${type}方法`
              })
            }
          }
          break
      }
      asyncCallback && asyncCallback.then((res) => {
        this.mpxIframe && this.mpxIframe.contentWindow && this.mpxIframe.contentWindow.postMessage && this.mpxIframe.contentWindow.postMessage({
          type: type,
          callbackId: data.callbackId,
          result: res
        }, event.origin)
      }).catch((error) => {
        this.mpxIframe && this.mpxIframe.contentWindow && this.mpxIframe.contentWindow.postMessage && this.mpxIframe.contentWindow.postMessage({
          type: type,
          callbackId: data.callbackId,
          error
        }, event.origin)
      })
    },
    hostValidate (host) {
      const hostWhitelists = mpx.config.webviewConfig && mpx.config.webviewConfig.hostWhitelists || []
      if (hostWhitelists.length) {
        return hostWhitelists.some((item) => {
          return host.endsWith(item)
        })
      } else {
        return true
      }
    }
  }
}
</script>

<style>
.mpx-iframe {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}
</style>