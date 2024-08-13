import  { deeplyParseHeader, slugify$1 }  from '../headerMdPlugin'

export default (options, ctx) => ({
    async ready () {
        const { pages } = ctx
        pages.forEach(page => {
            if (page.headers) {
                page.headers.forEach(header => {
                    const slug = slugify$1(header.title)
                    const title = deeplyParseHeader(header.title)
                    header.title = title
                    header.slug = slug
                })
            }
        })
    }
})
