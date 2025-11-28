/**
 * View 组件测试页面
 */
describe('View Component Test Page', () => {
  beforeAll(async () => {
    // 从首页点击 view 组件入口，触发 navigateTo 跳转
    await element(by.id('component-view')).tap();
    await waitFor(element(by.id('viewPage')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('renders view page correctly', async () => {
    await expect(element(by.id('viewTitle'))).toHaveText('View 组件能力测试');
  });

  it('shows all test type options', async () => {
    await expect(element(by.id('testType-basic'))).toBeVisible();
    await expect(element(by.id('testType-background'))).toBeVisible();
    await expect(element(by.id('testType-shadow'))).toBeVisible();
    await expect(element(by.id('testType-radius'))).toBeVisible();
    await expect(element(by.id('testType-transform'))).toBeVisible();
    await expect(element(by.id('testType-opacity'))).toBeVisible();
    await expect(element(by.id('testType-animation'))).toBeVisible();
    await expect(element(by.id('testType-simple-view'))).toBeVisible();
    await expect(element(by.id('testType-mixed'))).toBeVisible();
  });

  it('shows count options', async () => {
    await expect(element(by.id('count-10'))).toBeVisible();
    await expect(element(by.id('count-50'))).toBeVisible();
    await expect(element(by.id('count-100'))).toBeVisible();
    await expect(element(by.id('count-500'))).toBeVisible();
    await expect(element(by.id('count-1000'))).toBeVisible();
  });

  it('shows lifecycle info section', async () => {
    await expect(element(by.id('lifecycleInfo'))).toBeVisible();
    await expect(element(by.id('currentTestType'))).toBeVisible();
    await expect(element(by.id('currentCount'))).toBeVisible();
    await expect(element(by.id('duration'))).toBeVisible();
  });

  it('tests basic with 100 views', async () => {
    // 默认是 basic，设置 count 为 100
    await element(by.id('count-100')).tap();
    await element(by.id('runTestBtn')).tap();
    // 等待组件渲染完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Basic');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-basic');
  });

  it('tests background with 100 views', async () => {
    await element(by.id('testType-background')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Background');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-background');
  });

  it('tests shadow with 100 views', async () => {
    await element(by.id('testType-shadow')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Shadow');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-shadow');
  });

  it('tests radius with 100 views', async () => {
    await element(by.id('testType-radius')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Radius');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-radius');
  });

  it('tests transform with 100 views', async () => {
    await element(by.id('testType-transform')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Transform');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-transform');
  });

  it('tests opacity with 100 views', async () => {
    await element(by.id('testType-opacity')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Opacity');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-opacity');
  });

  it('tests animation with 10 views (fixed)', async () => {
    await element(by.id('testType-animation')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2500));
    await expect(element(by.id('currentTestType'))).toHaveText('Animation');
    await expect(element(by.id('currentCount'))).toHaveText('10');
    await device.takeScreenshot('view-animation');
  });

  it('tests simple-view with 100 views', async () => {
    await element(by.id('testType-simple-view')).tap();
    // animation 后 count 变成了 10，需要重新设置为 100
    await element(by.id('count-100')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('Simple View');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-simple-view');
  });

  it('tests mixed with 100 views', async () => {
    await element(by.id('testType-mixed')).tap();
    await element(by.id('runTestBtn')).tap();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await expect(element(by.id('currentTestType'))).toHaveText('综合');
    await expect(element(by.id('currentCount'))).toHaveText('100');
    await device.takeScreenshot('view-mixed');
  });

  afterAll(async () => {
    // 点击页面内返回按钮，回到首页
    await element(by.id('backBtn')).tap();
    await waitFor(element(by.id('indexPage')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
