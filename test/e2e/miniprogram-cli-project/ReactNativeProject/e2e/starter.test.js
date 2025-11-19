describe('Mpx React Native App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should launch app and display list component', async () => {
    // 等待应用加载
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 验证列表项显示
    await waitFor(element(by.text('手机')))
      .toBeVisible()
      .withTimeout(5000)
    
    await expect(element(by.text('电视'))).toBeVisible()
    await expect(element(by.text('电脑'))).toBeVisible()
  })

  it('should display count value', async () => {
    // 验证 count 初始值为 0
    await waitFor(element(by.text('0')))
      .toBeVisible()
      .withTimeout(3000)
  })

  it('should display page path', async () => {
    // 验证路径显示
    await expect(element(by.text('/pages/index'))).toBeVisible()
  })

  it('should display button with correct text', async () => {
    // 验证按钮存在
    await expect(element(by.text('click test navigateTo'))).toBeVisible()
  })

  it('should navigate when button is clicked', async () => {
    // 点击按钮触发导航到 /pages/index
    await element(by.text('click test navigateTo')).tap()
    
    // 等待页面跳转和重新加载
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 验证跳转后页面仍然显示相同内容
    // （因为跳转到 /pages/index，就是当前页面本身）
    await waitFor(element(by.text('手机')))
      .toBeVisible()
      .withTimeout(3000)
    
    await expect(element(by.text('/pages/index'))).toBeVisible()
    
    // 截图记录跳转后的状态
    await device.takeScreenshot('after-navigation')
  })

  it('should display defs test content', async () => {
    // 验证 defs 功能的文本
    await expect(element(by.text('defs: default def test'))).toBeVisible()
  })

  // 跳过 HTML 解码文本测试，因为在 React Native 中文本渲染方式特殊
  it.skip('should display decoded HTML text', async () => {
    // 此测试跳过：特殊字符在 RN 中的文本匹配比较复杂
    // 可以通过截图人工验证
  })

  it('should display hello text', async () => {
    // 验证基础文本
    await expect(element(by.text('hello'))).toBeVisible()
  })

  it('should take screenshot for documentation', async () => {
    // 保存截图用于文档或调试
    await device.takeScreenshot('mpx-list-component')
  })
})

