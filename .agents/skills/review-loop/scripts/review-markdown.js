'use strict'

const header = '# Review Loop 评审'
const empty = '无。'

function renderList (items, format) {
  return items.length ? items.map(function (item) { return '- ' + format(item) }).join('\n') : empty
}

function renderEntries (items, format) {
  return items.length ? items.map(format).join('\n\n') : empty
}

function render (review) {
  const evidence = review.evidence
  return [
    header,
    '',
    '- 轮次：`' + review.round + '`',
    '- 结论：`' + review.status + '`',
    '',
    '## 评审摘要',
    '',
    review.summary.trim(),
    '',
    '## 已检查文件',
    '',
    renderList(evidence.reviewedPaths, function (item) { return '`' + item + '`' }),
    '',
    '## 评审问题',
    '',
    renderEntries(review.findings, function (item) {
      return [
        '### `' + item.id + '`',
        '',
        '- 严重程度：`' + item.severity + '`',
        '- 分类：' + item.category,
        '- 目标：`' + item.target + '`',
        '',
        '#### 问题',
        '',
        item.comment.trim(),
        '',
        '#### 建议',
        '',
        item.suggestion.trim()
      ].join('\n')
    }),
    '',
    '## 剩余风险',
    '',
    renderList(evidence.residualRisks, function (item) { return item }),
    ''
  ].join('\n')
}

function parseEntries (raw, label, parseEntry) {
  if (raw === empty) return []
  const entries = raw.split(/(?=^### )/m)
  if (!entries.length || entries.some(function (entry) { return !entry.startsWith('### ') })) {
    throw new Error(label + '不符合固定格式')
  }
  return entries.map(function (entry, index) {
    return parseEntry(entry.trim(), label + '第 ' + (index + 1) + ' 项')
  })
}

function parsePaths (raw) {
  const paths = raw.split('\n').map(function (line) {
    const match = line.match(/^- `([^`\n]+)`$/)
    if (!match) throw new Error('已检查文件不符合固定格式')
    return match[1]
  })
  if (!paths.length) throw new Error('已检查文件不能为空')
  return paths
}

function parseFindings (raw) {
  return parseEntries(raw, '评审问题', function (entry, label) {
    const match = entry.match(/^### `([^`\n]+)`\n\n- 严重程度：`(critical|major|minor|nit)`\n- 分类：([^\n]+)\n- 目标：`([^`\n]+)`\n\n#### 问题\n\n([\s\S]+?)\n\n#### 建议\n\n([\s\S]+)$/)
    if (!match) throw new Error(label + '不符合固定格式')
    return {
      id: match[1],
      severity: match[2],
      category: match[3],
      target: match[4],
      comment: match[5].trim(),
      suggestion: match[6].trim()
    }
  })
}

function parseRisks (raw) {
  if (raw === empty) return []
  return raw.split('\n').map(function (line) {
    const match = line.match(/^- ([^\n]+)$/)
    if (!match) throw new Error('剩余风险不符合固定格式')
    return match[1]
  })
}

function parse (raw) {
  const content = raw.replace(/\r\n/g, '\n')
  const match = content.match(/^# Review Loop 评审\n\n- 轮次：`(\d+)`\n- 结论：`(approved|changes_requested)`\n\n## 评审摘要\n\n([\s\S]+?)\n\n## 已检查文件\n\n([\s\S]+?)\n\n## 评审问题\n\n([\s\S]+?)\n\n## 剩余风险\n\n([\s\S]+?)\n?$/)
  if (!match) throw new Error('评审 Markdown 不符合固定格式')
  return {
    round: Number(match[1]),
    status: match[2],
    summary: match[3].trim(),
    findings: parseFindings(match[5].trim()),
    evidence: {
      reviewedPaths: parsePaths(match[4].trim()),
      residualRisks: parseRisks(match[6].trim())
    }
  }
}

module.exports = { parse, render }
