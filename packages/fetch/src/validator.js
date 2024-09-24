import { isString, isArray, isFunction, isObject, isNotEmptyObject, isNotEmptyArray, type, doTest } from './util'

/**
 * 校验参数是否正确
 * @param rules 参数规则
 * @param config 参数实例
 * @returns {boolean}
 */
export function doValidator (rules, config, greedy, env) {
  // 错误的result length不为0的时候 不发送请求
  const errorResult = []
  // warning的result length不为0的时候 也会发送请求 只是一个warning
  const warningResult = []
  const ruleBackUp = Object.assign({}, rules)
  for (const key in config) {
    const rule = ruleBackUp[key]
    const param = config[key]
    // 没添加校验规则但是参数里有这个属性但是无需校验所有参数
    if (!rule && typeof greedy !== 'undefined' && !greedy) {
      continue
    }
    // 没添加校验规则但是参数里有这个属性
    if (!rule) {
      errorResult.push(`请给${key}属性添加校验规则`)
      continue
    }

    // 参数值是undefined或者是null
    if (param === undefined || param === null) {
      warningResult.push(`${key}参数的值是null或undefined`)
      continue
    }

    // 有校验规则并且参数里也有这个属性
    const testType = rule?.type ? rule.type : rule
    switch (testType) {
        // 校验type是undefined
      case undefined:
        warningResult.push(`请给${key}属性添加type类型`)
        break
        // 校验enum类型
      case 'enum':
        isNotEmptyArray(rule.include)
            ? !(rule.include.indexOf(config[key]) > -1) && errorResult.push(`${key}属性枚举值不正确`)
            : errorResult.push(`${key}属性枚举值为空数组`)
        break
        // any类型不校验
      case 'any':
        break
        // 手机号类型
      case 'phone':
        if (!/^\d{11}$/.test(config[key] + '')) errorResult.push(`${key}属性类型校验不通过`)
        break
        // 自定义参数校验
      case 'custom':
        if (isFunction(rule.custom)) {
          const customRes = rule.custom(config, env, validate)
          if (isObject(customRes)) {
            !customRes.valid && customRes.errorResult && errorResult.push(`${key} ${customRes.errorResult}`)
            customRes.warningResult && warningResult.push(`${key} ${customRes.warningResult}`)
          } else if (typeof customRes === 'boolean' && !customRes) {
            errorResult.push(`${key}自定义参数校验错误`)
          }
        } else {
          errorResult.push('如果是自定义类型校验请添加自定义校验函数')
        }
        break
        // 一般属性校验
      default:
        if (rule.include) {
          warningResult.push(`${rule.type}不属于枚举类型校验，不应当存在inlcude属性`)
        }
        // eslint-disable-next-line no-case-declarations
        let typeMatched
        try {
          if (isArray(testType)) {
            const vType = testType.map((item) => {
              return item.toLowerCase()
            })
            isNotEmptyArray(vType)
                ? typeMatched = vType.indexOf(type(config[key]).toLowerCase()) > -1
                : warningResult.push(`${key}属性校验type为空数组`)
          } else if (isString(testType)) {
            typeMatched = type(config[key]).toLowerCase() === testType.toLowerCase()
          }
          !typeMatched && errorResult.push(`${key}属性类型不正确`)
        } catch (err) {
          errorResult.push(err.toString())
        }
    }

    ruleBackUp[key] && delete ruleBackUp[key]
  }
  // 添加了校验规则但是参数里没有的属性且require为true的情况
  // 默认require是true
  Object.keys(ruleBackUp).forEach(key => {
    let require = ruleBackUp[key]?.require
    // 支持require传入方法
    if (isFunction(require)) {
      const requireRet = require(config, env)
      if (typeof requireRet === 'boolean') require = requireRet
    }
    if (require || require === undefined) {
      errorResult.push(`请添加必传的${key}属性`)
    }
  })
  return {
    valid: !errorResult.length,
    errorResult: errorResult.join(','),
    warningResult: warningResult.join(',')
  }
}
function mergeRes (oldRes, newRes) {
  const errMsgArr = []
  const warningMsgArr = []
  if (oldRes.errorResult) errMsgArr.push(oldRes.errorResult)
  if (oldRes.warningResult) warningMsgArr.push(oldRes.warningResult)

  if (newRes.errorResult) errMsgArr.push(newRes.errorResult)
  if (newRes.warningResult) warningMsgArr.push(newRes.warningResult)

  return {
    valid: oldRes.valid && newRes.valid,
    errorResult: errMsgArr.join(' '),
    warningResult: warningMsgArr.join(' ')
  }
}
// custom校验
export function validate (config, rules, env, greedy = true) {
  let error = {
    valid: true,
    errorResult: '',
    warningResult: ''
  }
  let res
  const copyConfig = Object.assign({}, config)
  Object.keys(rules).forEach((key) => {
    // if(rules[key].custom && isFunction(rules[key].custom)) {
    //   res = rules[key].custom(config, env, validate)
    //   if(isObject(res)) {
    //     error = mergeRes(error, res)
    //   } else if(typeof res === 'boolean'){
    //     error = mergeRes(error, {
    //       valid: res,
    //       errorResult: res ? '' : `${key}校验错误`
    //     })
    //   } else {
    //     error = mergeRes(error, {
    //       valid: false,
    //       errorResult: 'custom返回格式不正确，仅支持boolean或object'
    //     })
    //   }
    // } else {
    res = doValidator({ [key]: rules[key] }, config, false, env)
    error = mergeRes(error, res)
    // }
    // eslint-disable-next-line no-prototype-builtins
    copyConfig.hasOwnProperty(key) && delete copyConfig[key]
  })
  if (greedy) {
    Object.keys(copyConfig).forEach(key => {
      error = mergeRes(error, {
        valid: false,
        errorResult: `请给${key}属性添加校验规则`
      })
    })
  }
  return error
}
// 请求拦截
export function Validator (options, config) {
  let result = {
    valid: true
  }
  const hasRules = options.rules?.some((item) => {
    const realTest = isNotEmptyArray(item.test) ? item.test : isNotEmptyObject(item.test) ? [item.test] : []
    return realTest?.some((match) => isFunction(match.custom) ? match.custom(config) : doTest(config, match).matched)
  })
  const exclude = options.exclude?.some(url => config.url.includes(url.replace('*', '')))
  const include = options.include?.some(url => config.url.includes(url.replace('*', '')))
  if (hasRules) {
    // eslint-disable-next-line array-callback-return
    options?.rules && options.rules.some((item) => {
      const { test, validator, greedy } = item
      const formatTest = isNotEmptyArray(test) ? test : isNotEmptyObject(test) ? [test] : []
      const realTest = formatTest.filter((match) => isFunction(match.custom) ? match.custom(config) : doTest(config, match).matched)
      if (realTest.length) {
        realTest.forEach(test => {
          // data 名字的参数
          const hasData = validator.data && (typeof validator.data === 'string' || Object.keys(validator.data).includes('type'))
          // params 名字的参数
          const hasParams = validator.params && (typeof validator.params === 'string' || Object.keys(validator.params).includes('type'))
          // 如果 checkType 是 true 那么表示 validator 下是不区分 data 和 params 分开校验的
          const checkType = (!validator.params && !validator.data) || hasParams || hasData
          const isPostMethod = /^POST|PUT$/i.test(config.method)
          if (checkType) {
            result = doValidator(validator, Object.assign({}, config.params, config.data), greedy, options.env)
          } else {
            if (isPostMethod) {
              const dataRes = doValidator(validator.data, config.data, greedy, options.env)
              const paramsRes = doValidator(validator.params, config.params, greedy, options.env)
              result = mergeRes(dataRes, paramsRes)
            } else {
              result = doValidator(validator.params, config.params, greedy, options.env)
            }
          }
          return true
        })
      }
    })
  } else if (include && !exclude) {
    result = {
      valid: false,
      errorResult: `${config.url}接口配置了强校验，请添加校验规则`
    }
  }
  return Object.assign(result, {
    url: config.url
  })
}
