import { isString, isArray, isFunction, isObject, isNotEmptyArray, type, doTest } from './util'

/**
 * 校验参数是否正确
 * @param rules 参数规则
 * @param config 参数实例
 * @returns {boolean}
 */
export function doValidator (rules, config, url, greedy) {
  // 错误的result length不为0的时候 不发送请求
  let errorResult = []
  // warning的result length不为0的时候 也会发送请求 只是一个warning
  let warningResult = []
  let ruleBackUp = Object.assign({}, rules)
  for (let key in config){
    // 没添加校验规则但是参数里有这个属性但是无需校验所有参数
    if (!ruleBackUp[key] && typeof greedy !== 'undefined' && !greedy) {
      continue
    }
    // 没添加校验规则但是参数里有这个属性
    if (!ruleBackUp[key]) {
      errorResult.push(`请给${key}属性添加校验规则`)
      continue
    }

    // 参数值是undefined或者是null
    if (config[key] === undefined || config[key] === null) {
      warningResult.push(`${key}参数的值是null或undefined或0或空字符串`)
      continue
    }

    // 有校验规则并且参数里也有这个属性
    switch (ruleBackUp[key]?.type) {
      // 校验type是undefined
      case undefined:
        warningResult.push(`请给${key}属性添加type类型`)
        break
      // 校验enum类型
      case 'enum':
        isNotEmptyArray(ruleBackUp[key].include) ? !(ruleBackUp[key].include.indexOf(config[key]) > -1) && errorResult.push(`${key}属性枚举值不正确`) : errorResult.push(`${key}属性枚举值为空数组`)
        break
      // any类型不校验
      case 'any':
        break
      // 一般属性校验
      default:
        let typeMatched
        try {
          if (isArray(ruleBackUp[key].type)) {
            const vType = ruleBackUp[key].type.map((item) => {
              return item.toLowerCase()
            })
            isNotEmptyArray(vType) ?  typeMatched = vType.indexOf(type(config[key]).toLowerCase()) > -1 : warningResult.push(`${key}属性校验type为空数组`)
          } else if (isString(ruleBackUp[key].type)) {
            typeMatched = type(config[key]).toLowerCase() === ruleBackUp[key].type.toLowerCase()
          }
          !typeMatched && errorResult.push(`${key}属性类型不正确`)
        } catch (err) {
          errorResult.push(err.toString())
        }
    }
  
    ruleBackUp[key] && delete ruleBackUp[key]
  }
// 添加了校验规则但是参数里没有的属性且require为true的情况
  Object.keys(ruleBackUp).forEach(key=>{
    if (ruleBackUp[key]?.require) {
      errorResult.push(`请添加必传的${key}属性`)
    }
  })
  console.warn(' validator url ',url ,'warningResult',warningResult)
  return {
    valid: !errorResult.length,
    message: errorResult,
    url,
    warningResult: warningResult.join(',')
  }
}
// 请求拦截
export function Validator(options, config) {
  let result
  options?.length && options.some((item) => {
    const { test, validator, waterfall, greedy } = item
    const matched = isFunction(test.custom) ? test.custom(config) : doTest(config, test).matched
    if (matched) {
      if (isFunction(validator.custom)) {
        result = validator.custom(config)
        return true
      }
      // 如果checkType是true那么表示validator下是不区分data和params分开校验的
      const checkType = validator[Object.keys(validator)[0]] && Object.keys(validator[Object.keys(validator)[0]]).includes('type') && !isObject(validator[Object.keys(validator)[0]]?.type)
      const isPostMethod = /^POST|PUT$/i.test(config.method)
      if (checkType) {
        result =  doValidator(validator, Object.assign({}, config.params, config.data), test.path, greedy)
      } else {
        if (isPostMethod) {
          let dataRes = doValidator(validator.data, config.data, test.path, greedy)
          let paramsRes = doValidator(validator.params, config.params, test.path, greedy)
          result = {
            valid: dataRes.valid && paramsRes.valid,
            message: dataRes.message.concat(paramsRes.message),
            url: test.path,
            warningResult: dataRes.warningResult.concat(paramsRes.warningResult).join(',')
          }
        } else {
          result = doValidator(validator.params, config.params, test.path, greedy) 
        }
      }
      return true
    }
  })
  return result
}