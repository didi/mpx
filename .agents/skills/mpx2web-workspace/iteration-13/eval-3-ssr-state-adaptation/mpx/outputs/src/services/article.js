// 只读文章数据可由两端共用；返回副本，避免请求间共享可变文章对象。
// 服务返回真正的 Promise，且不依赖 window、document 或宿主网络 API。
const articles = {
  a: { id: 'a', title: '文章 A', body: '这是文章 A 的正文。', extra: '文章 A 的补充说明。' },
  b: { id: 'b', title: '文章 B', body: '这是文章 B 的正文。', extra: '文章 B 的补充说明。' }
}

export function fetchArticle (id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const article = articles[id]
      if (article) resolve(Object.assign({}, article))
      else reject(new Error('文章不存在'))
    }, id === 'a' ? 40 : 10)
  })
}
