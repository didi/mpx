const { matchCondition } = require('../utils/match-condition')
const addQuery  = require('../utils/add-query')
const { parseQuery } = require('loader-utils')

class MpxReplacePagesPlugin {
    constructor (config) {
        this.pagesCondition = config.pages
        this.defaultPageResource = config.defaultPageResource
    }

    isResolvingPage (obj) {
        // valid query should start with '?'
        const query = obj.query || '?'
        return parseQuery(query).isPage
    }

    apply (compiler) {
        compiler.resolverFactory.hooks.resolver.intercept({
            factory: (type, hook) => {
                hook.tap('MpxPartialCompilePlugin', (resolver) => {
                    resolver.hooks.result.tapAsync({
                        name: 'MpxPartialCompilePlugin',
                        stage: -100
                    }, (obj, resolverContext, callback) => {
                        if (this.isResolvingPage(obj) && !matchCondition(obj.path, this.pagesCondition)) {
                            obj.path = addQuery(obj.path + obj.query, {aliasResourcePath: this.defaultPageResource})
                        }
                        callback(null, obj)
                    })
                })
                return hook
            }
        })
    }
}

module.exports = MpxReplacePagesPlugin
