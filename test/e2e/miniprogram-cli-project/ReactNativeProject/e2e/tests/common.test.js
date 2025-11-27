/**
 * Common 页面测试
 */
describe('Common Page', () => {
  beforeAll(async () => {
    // 从首页点击"其他"入口，触发 navigateTo 跳转到 common 页面
    await element(by.id('component-其他')).tap();
    await waitFor(element(by.id('homePage')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('renders common page correctly', async () => {
    // 验证页面已加载（通过检查 backBtn 存在）
    await expect(element(by.id('backBtn'))).toBeVisible();
  });

  it('counter increases by 2 when button is clicked', async () => {
    await expect(element(by.id('counter'))).toHaveText('0');
    await element(by.id('counterBtn')).tap();
    await expect(element(by.id('counter'))).toHaveText('2');
    await element(by.id('counterBtn')).tap();
    await expect(element(by.id('counter'))).toHaveText('4');
  });

  it('input syncs with display', async () => {
    await element(by.id('input')).replaceText('mpxTest');
    await expect(element(by.id('inputResult'))).toHaveText('mpxTest');
  });

  it('renders the list with 3 items', async () => {
    await expect(element(by.id('listItem-0'))).toBeVisible();
    await expect(element(by.id('listItem-1'))).toBeVisible();
    await expect(element(by.id('listItem-2'))).toBeVisible();
    await expect(element(by.text('Apple'))).toBeVisible();
    await expect(element(by.text('Banana'))).toBeVisible();
    await expect(element(by.text('Orange'))).toBeVisible();
  });

  it('verifies advanced features section exists', async () => {
    // 滚动到底部查看高级特性
    await element(by.id('homePage')).scroll(300, 'down');
    await new Promise(resolve => setTimeout(resolve, 500));
    // 只检查元素存在，不检查可见性（因为可能被部分遮挡）
    await expect(element(by.id('page2-defs'))).toExist();
    await expect(element(by.id('page2-mixins'))).toExist();
    await expect(element(by.id('page2-i18n'))).toExist();
  });

  it('takes screenshot for common page', async () => {
    await device.takeScreenshot('common-page');
  });

  afterAll(async () => {
    // 先滚动回顶部，确保返回按钮可见
    await element(by.id('homePage')).scroll(300, 'up');
    await new Promise(resolve => setTimeout(resolve, 300));
    // 点击页面内返回按钮，回到首页
    await element(by.id('backBtn')).tap();
    await waitFor(element(by.id('indexPage')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
