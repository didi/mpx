import { changeOpts, getEnvObj } from '../../common/js'

const QQ_OBJ = getEnvObj()

const getWxToQqApi = ({ optimize = false }) => {
  return {
    /**
     * 订阅消息
     * @param options
     */
    requestSubscribeMessage (options = {}) {
      const opts = changeOpts(options, undefined, {
        subscribe: true
      })
      QQ_OBJ.subscribeAppMsg(opts)
    }
  }
}

export default getWxToQqApi
