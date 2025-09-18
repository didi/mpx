const cssIfLoader = require('../../../lib/style-compiler/strip-conditional-loader')

describe('css-if webpack loader - 测试用例', () => {
  // 测试简单的 if/else 条件
  it('简单条件: 当 isMobile 为 true 时，保留 if 分支内容', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true } })
    }
    const inputCSS = `
/*@mpx-if(isMobile)*/
.mobile { display: block; }
/*@mpx-else*/
.desktop { display: block; }
/*@mpx-end*/
    `
    const output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.mobile')
    expect(output).not.toContain('.desktop')
  })

  it('简单条件: 当 isMobile 为 false 时，保留 else 分支内容', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: false } })
    }
    const inputCSS = `
/*@mpx-if(isMobile)*/
.mobile { display: block; }
/*@mpx-else*/
.desktop { display: block; }
/*@mpx-end*/
    `
    const output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.desktop')
    expect(output).not.toContain('.mobile')
  })

  // 测试嵌套条件
  it('嵌套条件: 外层 isMobile 为 true 内层 hasFeature 为 true, 输出嵌套 if 分支内容', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true, hasFeature: true } })
    }
    const inputCSS = `
body { margin: 0; }
/*@mpx-if(isMobile)*/
.mobile {
  display: block;
  /*@mpx-if(hasFeature)*/
  .feature { color: red; }
  /*@mpx-else*/
  .feature { color: blue; }
  /*@mpx-endif*/
}
/*@mpx-else*/
.desktop { display: block; }
/*@mpx-endif*/
header { color: red }
    `
    const output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.mobile')
    expect(output).toContain('.feature { color: red; }')
    expect(output).toContain('header { color: red }')
    expect(output).not.toContain('.feature { color: blue; }')
    expect(output).not.toContain('.desktop')
  })

  it('嵌套条件: 外层 isMobile 为 true 内层 hasFeature 为 false, 输出内层 else 分支内容', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true, hasFeature: false } })
    }
    const inputCSS = `
body { margin: 0; }
/*@mpx-if(isMobile)*/
.mobile {
  display: block;
  /*@mpx-if(hasFeature)*/
  .feature { color: red; }
  /*@mpx-else*/
  .feature { color: blue; }
  /*@mpx-endif */
}
/*@mpx-else*/
.desktop { display: block; }
/* @mpx-endif*/
    `
    const output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.mobile')
    expect(output).toContain('.feature { color: blue; }')
    expect(output).not.toContain('.feature { color: red; }')
    expect(output).not.toContain('.desktop')
  })

  // 测试多个条件分支：if、elif、else 的情况
  it('多个条件分支: 优先匹配 if 分支，其次 elif，再到 else', () => {
    // 测试1： isMobile 为 false，isTablet 为 true，匹配 elif 分支
    let context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: false, isTablet: true } })
    }
    const inputCSS = `
header {}    
/*@mpx-if(isMobile)*/
.mobile { display: block; }
/*@mpx-elif(isTablet)*/
.tablet { display: block; }
/*@mpx-else*/
.desktop { display: block; }
/*@mpx-endif */
body {}
    `
    let output = cssIfLoader.call(context, inputCSS)
    expect(output).not.toContain('.mobile')
    expect(output).toContain('.tablet')
    expect(output).not.toContain('.desktop')
    expect(output).toContain('header {}')
    expect(output).toContain('body {}')

    // 测试2： isMobile 与 isTablet 均为 false，匹配 else 分支
    context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: false, isTablet: false } })
    }
    output = cssIfLoader.call(context, inputCSS)
    expect(output).not.toContain('.mobile')
    expect(output).not.toContain('.tablet')
    expect(output).toContain('.desktop')

    // 测试3： isMobile 为 true（优先匹配 if 分支），即使 isTablet 为 true
    context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true, isTablet: true } })
    }
    output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.mobile')
    expect(output).not.toContain('.tablet')
    expect(output).not.toContain('.desktop')
  })

  // 测试多个 if 块在一起的情况
  it('多个 if 块处理: 不同 if 条件处理各自独立', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true, showHeader: false } })
    }
    const inputCSS = `
/*@mpx-if(isMobile)*/
.mobile { display: block; }
/*@mpx-endif*/

/*@mpx-if(showHeader)*/
.header { height: 100px; }
/*@mpx-else*/
.header { height: 50px; }
/*@mpx-endif*/
    `
    const output = cssIfLoader.call(context, inputCSS)
    // 第一个 if 块：isMobile 为 true，输出 .mobile
    expect(output).toContain('.mobile')
    // 第二个 if 块：showHeader 为 false，应该保留 else 分支
    expect(output).not.toContain('height: 100px;')
    expect(output).toContain('height: 50px;')
  })
  it('多个 if 嵌套 elif 块处理', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true, showHeader: true } })
    }
    const inputCSS = `
/*@mpx-if(isMobile)*/
.mobile { display: block; }
  /*@mpx-if(false)*/
  .test1 {}
  /*@mpx-elif(showHeader)*/
  .test2 {}
  /*@mpx-endif*/
/*@mpx-endif*/
    `
    const output = cssIfLoader.call(context, inputCSS)
    expect(output).toContain('.mobile')
    expect(output).toContain('.test2')
  })

  it('错误处理: 缺少开始标签', () => {
    const context = {
      cacheable: jest.fn(),
      getMpx: () => ({ defs: { isMobile: true } })
    }
    const inputCSS = `
/*@mpx-elif(isMobile)*/
.mobile { display: block; }
`
    // 预期这种情况下应该抛出异常或给出警告
    expect(() => cssIfLoader.call(context, inputCSS)).toThrow(new Error('[Mpx style error]: elif without a preceding if'))
  })
})
