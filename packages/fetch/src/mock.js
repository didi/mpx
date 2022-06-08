
import { isFunction, doTest, transformRes, buildResponse } from './util'

// mock
export function requestMock (options = [], config) {
  const configBackup = Object.assign({}, config) // 备份请求配置
  for (let item of options) {
    const { test, mock: callback } = item
    // custom不存在时，进行url参数匹配
    const matched = doTest(configBackup, test).matched
    if (isFunction(callback) && matched) {
      let data =  Object.assign({ requestConfig: config }, transformRes(buildResponse(callback(config))))
      return Promise.resolve(data)
    }
  }
}
