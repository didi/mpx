import * as url from 'url'

export function normalized(proxy, defaultDomain) {
    let nomallizeProxy = []
    if (proxy instanceof Array) {
        nomallizeProxy = proxy
    }else if (proxy instanceof Object) {
        for(let [key, value] of Object.entries(proxy)) {
            if (typeof value === 'string') {
                nomallizeProxy.push({
                    context: [new RegExp(key, 'g')],
                    target: value
                })
            } else if (typeof value === 'object') {
                const { target, pathRewrite } = value
                nomallizeProxy.push({
                    context: [new RegExp(key, 'g')],
                    target,
                    pathRewrite
                })
            }   
        }
    } else {
        throw new Error('The proxy parameter must be an object or an array')
    }

    return nomallizeProxy.map(item => {
        return {
            ...item,
            target: addDomain(item.target, defaultDomain),
        }
    })
}

function addDomain(target, defaultDomain) {
    let targetOptions = url.parse(target)
    let defaultOptions = url.parse(defaultDomain)
    return targetOptions.host ? target : `${targetOptions.protocol || defaultOptions.protocol}//${targetOptions.host || defaultOptions.host}${targetOptions.path || defaultOptions.path}`
}

function isPlainObj(value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}

function isValidRewriteConfig(rewriteConfig) {
    if (isPlainObj(rewriteConfig)) {
        return Object.keys(rewriteConfig).length !== 0;
    } else if (rewriteConfig === undefined || rewriteConfig === null) {
        return false;
    } else {
        throw new Error('Invalid pathRewrite config. Expecting object with pathRewrite config.');
    }
}

export function isValidProxyConfig(proxy) {

    if (!proxy) return false

    if (proxy instanceof Array) {
        for (let item of proxy) {
            if (!item.hasOwnProperty("target") || !item.hasOwnProperty("context")) {
                throw new Error('The array proxy object must contain target and context properties.')
            }
        }
    }else if (proxy instanceof Object) {
        for(let [key, value] of Object.entries(proxy)) {
            if (typeof value === 'string' && (!key || !value)) {
                throw new Error('key and value cannot be empty.')
            } else if (typeof value === 'object' && (!value.hasOwnProperty('target'))) {
                throw new Error('The terget property of the object must exist.')
            }
        }
    } else {
        throw new Error('Invalid proxy property. expect proxy property to be object or array.')
    }

    return true
}

function parsePathRewriteRules(rewriteConfig) {
    const rules = [];
  
    if (isPlainObj(rewriteConfig)) {
        for (const [key] of Object.entries(rewriteConfig)) {
            rules.push({
              regex: new RegExp(key),
              value: rewriteConfig[key],
            });
        }
    }

     return rules;
}


function rewritePath(rewriteConfig, path) {
    let result = path;
    
    if (!isValidRewriteConfig(rewriteConfig)) {
        return;
    }
    const rulesCache = parsePathRewriteRules(rewriteConfig)

    for (const rule of rulesCache) {
      if (rule.regex.test(path)) {
        result = result.replace(rule.regex, rule.value);        
        break;
      }
    }

    return result;
}

export function proxyUrl(nomallizeProxy, options ) {
    let proxyUrl = ''
    let { path } = url.parse(options.url)
    const reg1 = /(\/)\1*/g;

    let targetProxy = nomallizeProxy.filter(item => {
        let context = item.context.filter(reg => {
            return (reg.test && reg.test(path) || (~path.indexOf(reg)))
        })
        return !!context.length
    })[0]
    if(!targetProxy)  return 
    
    if (targetProxy && targetProxy.pathRewrite) {
        path = rewritePath(targetProxy.pathRewrite, path)
    }
    if(targetProxy && targetProxy.target) {        
        proxyUrl = targetProxy.target + path
        // remove extra /
        proxyUrl = proxyUrl.replace(reg1, function($, $1, $2) {
            return  $2 === 5 || $2 === 6 ? $ : $1
        })
    }

    options.url = proxyUrl
}
