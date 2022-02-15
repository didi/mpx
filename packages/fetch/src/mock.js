
import { isFunction, doTest } from './util'

// mock
export function requestMock (options = [], config) {
  const configBackup = Object.assign({}, config) // 备份请求配置

  for (let item of options) {
    const { test, mock: callback } = item
    // custom不存在时，进行url参数匹配
    const matched = (!test.custom) && doTest(configBackup, test).matched
    if (isFunction(callback) && ((isFunction(test.custom) && test.custom(configBackup)) || matched)) {
      let data = callback.call(config)
      return Promise.resolve(data)
    }
  }
}
