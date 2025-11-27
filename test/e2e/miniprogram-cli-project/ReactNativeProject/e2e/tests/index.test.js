/**
 * 首页测试
 */
describe('Index Page', () => {
  it('renders index page correctly', async () => {
    await waitFor(element(by.id('indexPage')))
      .toBeVisible()
      .withTimeout(3000);
    await expect(element(by.id('indexTitle'))).toHaveText('MPX 组件测试');
  });

  it('shows component list with view and common entries', async () => {
    await expect(element(by.id('component-view'))).toBeVisible();
    await expect(element(by.id('component-其他'))).toBeVisible();
  });
});

