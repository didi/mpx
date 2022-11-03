
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g;
const anchorReg = /\{#([a-z0-9\-_]+?)\}\s*$/
const slugify$1 = (content) => {
    let str = content
    if (anchorReg.test(content)) {
        str = anchorReg.exec(content)[1]
    }
    return str.replace(rControl, "").replace(rSpecial, "-").replace(/\-{2,}/g, "-").replace(/^\-+|\-+$/g, "").replace(/^(\d)/, "_$1").toLowerCase();
};

const removeSlug$1 = (content) => {
    let str = content
    if (anchorReg.test(content)) {
        str = str.split('{#')[0]
    }
    return str
}
const parseEmojis = (str) => {
    return str.replace(/:(.+?):/g, (placeholder, key) => require$$0$3[key] || placeholder);
};
const unescapeHtml = (html) => html.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x3A;/g, ":").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const removeMarkdownTokens = (str) => str.replace(/(\[(.[^\]]+)\]\((.[^)]+)\))/g, "$2").replace(/(`|\*{1,3}|_)(.*?[^\\])\1/g, "$2").replace(/(\\)(\*|_|`|\!|<|\$)/g, "$2");
const remvoeCustomAnchor = (str) => str.replace(/\{#([a-z0-9\-_]+?)\}\s*$/, "");
const trim = (str) => str.trim();
const removeNonCodeWrappedHTML = (str) => {
    return String(str)
};
const compose = (...processors) => {
    if (processors.length === 0)
        return (input) => input;
    if (processors.length === 1)
        return processors[0];
    return processors.reduce((prev, next) => {
        return (str) => next(prev(str));
    });
};
const parseHeader = compose(unescapeHtml, parseEmojis, remvoeCustomAnchor, removeMarkdownTokens, trim);
const deeplyParseHeader = compose(removeNonCodeWrappedHTML, parseHeader);

const headerPlugin = (md, include = ["h2", "h3"]) => {
    md.renderer.rules.heading_open = (tokens, i, options, env, self) => {
        const token = tokens[i];
        if (include.includes(token.tag)) {
            const title = tokens[i + 1].content;
            const slug = slugify$1(title)
            const parseTitle = deeplyParseHeader(title)
            tokens[i + 1].content = parseTitle
            token.attrs.forEach((item) => {
                if (item[0] === 'id') {
                    item[1] = slug
                }
            })
            const nextToken = tokens[i + 1]
            if (nextToken.type === 'inline') {
                const inlineTokenChild = nextToken.children
                inlineTokenChild.forEach((child, index) => {
                    if (child.type === 'link_open') {
                        child.attrs = child.attrs.map((item) => {
                            if (item[0] === 'href') {
                                item[1] = '#' + slug
                            }
                            return item
                        })
                    }
                    if (child.type === 'text' && child.content && child.content.trim()) {
                        if (child.content.includes('{#')) {
                            child.content = removeSlug$1(child.content)
                        }
                    }
                })
            }
        }
        return self.renderToken(tokens, i, options);
    };
};


module.exports = {
    headerPlugin,
    deeplyParseHeader,
    slugify$1
}
