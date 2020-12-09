import { changeOpts, getEnvObj } from '../../common/js'

const Qa_OBJ = getEnvObj()

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
      Qa_OBJ.subscribeAppMsg(opts)
    }
  }
}

export default getWxToQaApi
