
class CompressName {
    constructor () {
        this.index = 0
        this._compressMap = new Map()
    }

    _generateName () {
        let name = this.index.toString(36)
        // 首字母不能是数字（转化为number不是NaN就是数字）
        if (!isNaN(+name[0])) name = 'a' + name.substring(1)
        this.index = parseInt(name, 36) + 1
        return name
    }

    // 指定不允许使用的key
    // occupiedKey: string[] | string
    _occupiedGenerateName (occupiedKey) {
        let key = this._generateName()

        if (!occupiedKey) return key
        if (typeof occupiedKey === 'string') occupiedKey = [occupiedKey]

        while (occupiedKey.indexOf(key) !== -1) {
            key = this._generateName()
        }
        return key
    }

    compress (source, occupiedKey) {
        if (!this._compressMap.has(source)) {
            this._compressMap.set(source, this._occupiedGenerateName(occupiedKey))
        }
        return this._compressMap.get(source)
    }
}

const namespaces = {}
function generateVariableNameBySource (source, namespace, occupiedKey) {
    if (!namespaces[namespace]) {
        // 限制只能字母开头
        namespaces[namespace] = new CompressName()
    }
    return namespaces[namespace].compress(source, occupiedKey)
}

const isProductionLikeMode = options => {
    return options.mode === 'production' || !options.mode
}

module.exports = {
    generateVariableNameBySource,
    isProductionLikeMode,
    CompressName
}
