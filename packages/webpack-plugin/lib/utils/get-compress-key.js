class CompressName {
    constructor(chars, allowStartChars) {
        this._arr = []
        //   this._occupiedNames = new Set()
        this._compressMap = new Map()
        // 允许使用的字符, 需要去重
        this.chars = typeof chars === 'string' ? [...new Set(chars.split(''))].join('') : 'abcdefghijklmnopqrstuvwxyz'
        // 首个字符允许的字符（生产变量名时用于指定禁止数字开头）
        this.allowStartChars = [...new Set(allowStartChars.split(''))].join('') || this.chars

        // 检查一下allowStartChars必须都在char中，以防运行阶段出现死循环
        for (const char of this.allowStartChars) {
            if (this.chars.indexOf(char) === -1) {
                throw new Error(`CompressName allowStartChars 包含 chars 中不存在的字符: "${char}"`)
            }
        }
    }

    _findStartCharIndex(startIndex) {
        for (let i = startIndex; i < this.chars.length; i++) {
            if (this.allowStartChars.indexOf(this.chars[i]) !== -1) {
                return i
            }
        }
        return -1
    }

    _generatorName() {
        if (this._arr.length === 0) {
            this._arr[0] = this._findStartCharIndex(0)
        } else {
            if (this._arr.length === 1) {
                this._arr[0] = this._findStartCharIndex(this._arr[0] + 1)
                if (this._arr[0] === -1) this._arr[0] = this.chars.length
            } else {
                this._arr[this._arr.length - 1]++
            }
            for (let i = this._arr.length - 1; i >= 0; i--) {
                if (this._arr[i] === this.chars.length) {
                    this._arr[i] = 0
                    if (i == 0) {
                        this._arr.unshift(this._findStartCharIndex(0))
                    } else if (i == 1) {
                        this._arr[i - 1] = this._findStartCharIndex(this._arr[i - 1] + 1)
                        if (this._arr[i - 1] === -1) this._arr[i - 1] = this.chars.length
                    } else {
                        this._arr[i - 1]++
                    }
                }
            }
        }
        return this._arr.map(num => this.chars[num]).join('')
    }

    // 指定不允许使用的key
    // occupiedKey: string[] | string
    _occupiedGeneratorName(occupiedKey) {
        let key = this._generatorName()

        if (!occupiedKey) return key
        if (typeof occupiedKey === 'string') occupiedKey = [occupiedKey]

        while (occupiedKey.indexOf(key) !== -1) {
            key = this._generatorName()
        }
        return key
    }

    compress(source, occupiedKey) {
        if (!this._compressMap.has(source)) {
            this._compressMap.set(source, this._occupiedGeneratorName(occupiedKey))
            // this._occupiedNames.add(this._compressMap.get(source))
        }
        return this._compressMap.get(source)
    }
}


const namespaces = {}
function generatorVariableNameBySource(source, namespace, occupiedKey) {
    if (!namespaces[namespace]) {
        // 限制只能字母开头
        namespaces[namespace] = new CompressName('abcdefghijklmnopqrstuvwxyz_-0123456789', 'abcdefghijklmnopqrstuvwxyz')
    }
    return namespaces[namespace].compress(source)
}

module.exports = {
    generatorVariableNameBySource
}
