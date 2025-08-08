export class ExpressionParser {
    tokens;
    formatter;
    functions;
    current;
    constructor(input, formatter = val => parseFloat(val), functions = {}) {
        this.tokens = this.tokenize(input);
        this.formatter = formatter;
        this.functions = functions;
        this.current = 0;
    }
    tokenize(input) {
        const tokens = [];
        const regex = /(\d+\.?\d*(?:px|rpx|%|vw|vh)?|[+\-*/(),]|\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;
        let match;
        while ((match = regex.exec(input))) {
            if (/^\d+\.?\d*(?:px|rpx|%|vw|vh)?$/.test(match[0])) {
                const lastToken = tokens[tokens.length - 1];
                const last2Token = tokens[tokens.length - 2];
                if (lastToken?.type === '-' && (!last2Token || /^[+\-*/(,]$/.test(last2Token?.type))) {
                    tokens.pop();
                    tokens.push({
                        type: 'NUMBER',
                        value: '-' + match[0]
                    });
                }
                else {
                    tokens.push({
                        type: 'NUMBER',
                        value: match[0]
                    });
                }
            }
            else {
                tokens.push({
                    type: match[0],
                    value: match[0]
                });
            }
        }
        return tokens;
    }
    parse() {
        return this.expression();
    }
    expression() {
        let node = this.term();
        while (this.current < this.tokens.length &&
            (this.tokens[this.current].type === '+' || this.tokens[this.current].type === '-')) {
            const operator = this.tokens[this.current].type;
            this.current++;
            const right = this.term();
            node = this.applyOperator(operator, node, right);
        }
        return node;
    }
    term() {
        let node = this.factor();
        while (this.current < this.tokens.length &&
            (this.tokens[this.current].type === '*' || this.tokens[this.current].type === '/')) {
            const operator = this.tokens[this.current].type;
            this.current++;
            const right = this.factor();
            node = this.applyOperator(operator, node, right);
        }
        return node;
    }
    factor() {
        const token = this.tokens[this.current];
        if (token.type === 'NUMBER') {
            this.current++;
            const numericValue = this.formatter(token.value);
            return { type: 'NUMBER', value: numericValue };
        }
        else if (token.type === '(') {
            this.current++;
            const node = this.expression();
            if (this.tokens[this.current].type !== ')') {
                throw new Error('Expected closing parenthesis');
            }
            this.current++;
            return node;
        }
        else if (this.functions[token.type]) {
            this.current++;
            if (this.tokens[this.current].type !== '(') {
                throw new Error('Expected opening parenthesis after function');
            }
            this.current++;
            const args = this.parseArguments();
            if (this.tokens[this.current].type !== ')') {
                throw new Error('Expected closing parenthesis');
            }
            this.current++;
            return this.applyFunction(token.type, args);
        }
        throw new Error(`Unexpected token: ${token.type}`);
    }
    parseArguments() {
        const args = [];
        while (this.current < this.tokens.length && this.tokens[this.current].type !== ')') {
            args.push(this.expression());
            if (this.tokens[this.current].type === ',') {
                this.current++;
            }
        }
        return args;
    }
    applyOperator(operator, left, right) {
        const leftVal = left.value;
        const rightVal = right.value;
        let result;
        switch (operator) {
            case '+':
                result = leftVal + rightVal;
                break;
            case '-':
                result = leftVal - rightVal;
                break;
            case '*':
                result = leftVal * rightVal;
                break;
            case '/':
                result = leftVal / rightVal;
                break;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
        return { type: 'NUMBER', value: result };
    }
    applyFunction(func, args) {
        if (args.some(arg => arg.type !== 'NUMBER')) {
            throw new Error('Function arguments must be numbers');
        }
        const numericArgs = args.map(arg => arg.value);
        if (this.functions[func]) {
            return { type: 'NUMBER', value: this.functions[func].apply(null, numericArgs) };
        }
        else {
            throw new Error(`Unknown function: ${func}`);
        }
    }
}
export function parseFunc(str, funcName) {
    const regex = new RegExp(`${funcName}\\(`, 'g');
    const result = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
        const start = match.index;
        let i = start + funcName.length + 1;
        let depth = 1;
        const args = [];
        let arg = '';
        while (depth && i < str.length) {
            if (depth === 1 && (str[i] === ',' || str[i] === ')')) {
                args.push(arg.trim());
                arg = '';
            }
            else {
                arg += str[i];
            }
            switch (str[i]) {
                case '(':
                    depth++;
                    break;
                case ')':
                    depth--;
                    break;
                default:
                // Do nothing
            }
            i++;
        }
        const end = regex.lastIndex = i;
        result.push({
            start,
            end,
            args
        });
    }
    return result;
}
export class ReplaceSource {
    _source;
    _replacements;
    constructor(source) {
        this._source = source;
        this._replacements = [];
    }
    replace(start, end, content) {
        this._replacements.push({ start, end, content });
    }
    source() {
        if (this._replacements.length === 0) {
            return this._source;
        }
        let current = this._source;
        let pos = 0;
        const result = [];
        for (const replacement of this._replacements) {
            const start = Math.floor(replacement.start);
            const end = Math.floor(replacement.end) + 1;
            if (pos < start) {
                const offset = start - pos;
                result.push(current.slice(0, offset));
                current = current.slice(offset);
                pos = start;
            }
            result.push(replacement.content);
            if (pos < end) {
                const offset = end - pos;
                current = current.slice(offset);
                pos = end;
            }
        }
        result.push(current);
        return result.join('');
    }
}
