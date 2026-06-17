function pad(s, width, right = false) {
    if (s.length >= width)
        return s;
    const fill = ' '.repeat(width - s.length);
    return right ? fill + s : s + fill;
}
function fmtMs(n) {
    return n.toFixed(2) + 'ms';
}
/**
 * 工厂函数：根据 options 生成一个 console reporter。
 *
 * 入参从 bus 拿到的就是已聚合的 `Map<name, AggResult>`（实时聚合 only），
 * 不再有原始事件可遍历——所以也没有 raw 选项了。
 *
 * 输出形式刻意避开 console.table —— React Native 远程调试 / Hermes inspector
 * 对 console.table 的支持参差不齐（典型表现是把每行渲染成 `{…}` 不展开），
 * 这里用对齐字符串 + 单条 console.log 输出，跨 RN / 浏览器 / Node 一致可读。
 */
export function createConsoleReporter(options = {}) {
    const { sortBy = 'sum', filter, header = true } = options;
    return (agg) => {
        const rows = [];
        let totalCount = 0;
        for (const [name, s] of agg) {
            if (filter) {
                if (typeof filter === 'string') {
                    if (!name.startsWith(filter))
                        continue;
                }
                else if (!filter.test(name)) {
                    continue;
                }
            }
            totalCount += s.count;
            rows.push({ name, count: s.count, sum: s.sum, avg: s.avg, max: s.max });
        }
        rows.sort((a, b) => b[sortBy] - a[sortBy]);
        // 列宽：取 max(列名长度, 各行该列字符串长度)，保证终端 / RN console 都对齐
        let nameW = 'name'.length;
        let countW = 'count'.length;
        let sumW = 'sum'.length;
        let avgW = 'avg'.length;
        let maxW = 'max'.length;
        const cells = rows.map(r => {
            const c = {
                name: r.name,
                count: String(r.count),
                sum: fmtMs(r.sum),
                avg: fmtMs(r.avg),
                max: fmtMs(r.max)
            };
            if (c.name.length > nameW)
                nameW = c.name.length;
            if (c.count.length > countW)
                countW = c.count.length;
            if (c.sum.length > sumW)
                sumW = c.sum.length;
            if (c.avg.length > avgW)
                avgW = c.avg.length;
            if (c.max.length > maxW)
                maxW = c.max.length;
            return c;
        });
        const headerLine = `${pad('name', nameW)}  ${pad('count', countW, true)}  ${pad('sum', sumW, true)}  ${pad('avg', avgW, true)}  ${pad('max', maxW, true)}`;
        const sepLine = `${'-'.repeat(nameW)}  ${'-'.repeat(countW)}  ${'-'.repeat(sumW)}  ${'-'.repeat(avgW)}  ${'-'.repeat(maxW)}`;
        const bodyLines = cells.map(c => `${pad(c.name, nameW)}  ${pad(c.count, countW, true)}  ${pad(c.sum, sumW, true)}  ${pad(c.avg, avgW, true)}  ${pad(c.max, maxW, true)}`);
        const title = `[mpx perf] ${rows.length} buckets / ${totalCount} samples`;
        const text = rows.length
            ? [title, headerLine, sepLine, ...bodyLines].join('\n')
            : `${title}\n(empty)`;
        /* eslint-disable no-console */
        if (header && typeof console.group === 'function') {
            console.group(title);
            console.log(rows.length ? [headerLine, sepLine, ...bodyLines].join('\n') : '(empty)');
        }
        else {
            console.log(text);
        }
        if (header && typeof console.groupEnd === 'function') {
            console.groupEnd();
        }
        /* eslint-enable no-console */
    };
}
/**
 * 默认 reporter：bus 在未被 setReporter 替换时使用它。
 * 行为等价于 createConsoleReporter() 默认参数。
 */
export const consoleReporter = createConsoleReporter();
