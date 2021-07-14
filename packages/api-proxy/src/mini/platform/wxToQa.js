import { changeOpts, getEnvObj } from '../../common/js'

const qaObj = getEnvObj()

const getWxToQaApi = ({ optimize = false }) => {
  return {
    /**
     * 订阅消息
     * @param options
     */
    requestSubscribeMessage (options = {}) {
      const opts = changeOpts(options, undefined, {
        subscribe: true
      })
      qaObj.subscribeAppMsg(opts)
    }
  }
}

export default getWxToQaApi
