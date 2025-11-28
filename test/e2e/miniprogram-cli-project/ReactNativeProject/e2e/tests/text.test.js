/**
 * Text 组件测试页面
 */
describe('Text Component Test Page', () => {
  beforeAll(async () => {
    // 从首页点击 text 组件入口，触发 navigateTo 跳转
    await element(by.id('component-text')).tap();
    await waitFor(element(by.id('textPage')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('renders text page correctly', async () => {
    await expect(element(by.id('textTitle'))).toHaveText('Text 组件能力测试');
  });

  it('shows all test type options', async () => {
    await expect(element(by.id('testType-basic'))).toBeVisible();
    await expect(element(by.id('testType-simple-text'))).toBeVisible();
    await expect(element(by.id('testType-font-size'))).toBeVisible();
    await expect(element(by.id('testType-var'))).toBeVisible();
    await expect(element(by.id('testType-calc'))).toBeVisible();
    await expect(element(by.id('testType-bindtap'))).toBeVisible();
    await expect(element(by.id('testType-line-height'))).toBeVisible();
    await expect(element(by.id('testType-mixed'))).toBeVisible();
  });

  it('tests basic with 100 texts', async () => {
    await element(by.id('count-100')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Basic');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-basic');
  });

  it('tests simple-text with 100 texts', async () => {
    await element(by.id('testType-simple-text')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Simple');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-simple');
  });

  it('tests font-size with 100 texts', async () => {
    await element(by.id('testType-font-size')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Font Size');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-font-size');
  });

  it('tests var (CSS variables) with 100 texts', async () => {
    await element(by.id('testType-var')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Var');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-var');
  });

  it('tests calc with 100 texts', async () => {
    await element(by.id('testType-calc')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Calc');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-calc');
  });

  it('tests bindtap with 20 texts', async () => {
    await element(by.id('testType-bindtap')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Bindtap');
    // bindtap 测试限制为 20 个以便交互
    await device.takeScreenshot('text-bindtap');
  });

  it('tests line-height with 100 texts', async () => {
    await element(by.id('testType-line-height')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Line Height');
    await device.takeScreenshot('text-line-height');
  });

  it('tests mixed with 100 texts', async () => {
    await element(by.id('testType-mixed')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('综合');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('text-mixed');
  });

  afterAll(async () => {
    // 点击页面内返回按钮，回到首页
    await element(by.id('backBtn')).tap();
    await waitFor(element(by.id('indexPage')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
